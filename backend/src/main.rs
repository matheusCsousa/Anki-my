#[macro_use]
extern crate rocket;
mod db;
mod headers;
mod models;
mod utils;
use models::*;
use rocket::fs::{FileServer, NamedFile};
use rocket::{
    State,
    http::{Method, Status},
    serde::json::Json,
};
use rocket_cors::{AllowedHeaders, AllowedOrigins, CorsOptions};
use sqlx::{PgPool, Row};
use std::path::{Path, PathBuf};
use std::{
    collections::HashMap,
    sync::Mutex,
    time::{Duration, Instant},
};
use uuid::Uuid;

#[derive(Default)]
struct AuthThrottle(Mutex<HashMap<String, (Instant, u32)>>);
impl AuthThrottle {
    fn allow(&self, username: &str) -> bool {
        let Ok(mut attempts) = self.0.lock() else {
            return false;
        };
        attempts.retain(|_, (start, _)| start.elapsed() < Duration::from_secs(60));
        // Bound both CPU spent on password hashing and memory consumed by arbitrary names.
        let global = attempts.entry("*".into()).or_insert((Instant::now(), 0));
        if global.1 >= 120 {
            return false;
        }
        global.1 += 1;
        if attempts.len() >= 500 {
            return false;
        }
        let entry = attempts
            .entry(format!("user:{username}"))
            .or_insert((Instant::now(), 0));
        if entry.1 >= 10 {
            return false;
        }
        entry.1 += 1;
        true
    }
}
fn db_error(error: sqlx::Error) -> Status {
    if let sqlx::Error::Database(ref db) = error {
        if db.is_unique_violation() {
            return Status::Conflict;
        }
    }
    eprintln!("Database operation failed: {error}");
    Status::InternalServerError
}
fn valid_name(name: &str) -> bool {
    !name.trim().is_empty() && name.chars().count() <= 100
}
fn valid_card(card: &CardInput) -> bool {
    [&card.front, &card.back]
        .iter()
        .all(|s| !s.trim().is_empty() && s.chars().count() <= 10000)
}
#[get("/health")]
async fn health(pool: &State<PgPool>) -> Result<&'static str, Status> {
    sqlx::query("SELECT 1")
        .execute(pool.inner())
        .await
        .map_err(db_error)?;
    Ok("ok")
}
#[post("/register", data = "<data>")]
async fn register(
    data: Json<Credentials>,
    pool: &State<PgPool>,
    secret: &State<JwtSecret>,
    throttle: &State<AuthThrottle>,
) -> Result<Json<LoginResponse>, Status> {
    let username = data.username.trim();
    if username.len() < 3
        || username.len() > 40
        || !username
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
        || data.password.len() < 8
        || data.password.len() > 72
    {
        return Err(Status::BadRequest);
    }
    if !throttle.allow(username) {
        return Err(Status::TooManyRequests);
    }
    let password = data.password.clone();
    let hash =
        rocket::tokio::task::spawn_blocking(move || bcrypt::hash(password, bcrypt::DEFAULT_COST))
            .await
            .map_err(|_| Status::InternalServerError)?
            .map_err(|_| Status::InternalServerError)?;
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO users(id, username, password) VALUES($1,$2,$3)")
        .bind(&id)
        .bind(username)
        .bind(hash)
        .execute(pool.inner())
        .await
        .map_err(db_error)?;
    Ok(Json(LoginResponse {
        token: utils::generate_token(&id, &secret.0).map_err(|_| Status::InternalServerError)?,
    }))
}
#[post("/login", data = "<data>")]
async fn login(
    data: Json<Credentials>,
    pool: &State<PgPool>,
    secret: &State<JwtSecret>,
    throttle: &State<AuthThrottle>,
) -> Result<Json<LoginResponse>, Status> {
    let username = data.username.trim();
    if username.len() > 100 || data.password.len() > 72 {
        return Err(Status::Unauthorized);
    }
    if !throttle.allow(username) {
        return Err(Status::TooManyRequests);
    }
    let row = sqlx::query("SELECT id, password FROM users WHERE username=$1")
        .bind(username)
        .fetch_optional(pool.inner())
        .await
        .map_err(db_error)?;
    let Some(row) = row else {
        return Err(Status::Unauthorized);
    };
    let id: String = row.get("id");
    let hash: String = row.get("password");
    let password = data.password.clone();
    let valid = rocket::tokio::task::spawn_blocking(move || bcrypt::verify(password, &hash))
        .await
        .map_err(|_| Status::InternalServerError)?
        .map_err(|_| Status::InternalServerError)?;
    if !valid {
        return Err(Status::Unauthorized);
    }
    Ok(Json(LoginResponse {
        token: utils::generate_token(&id, &secret.0).map_err(|_| Status::InternalServerError)?,
    }))
}
const DECK_QUERY: &str = "SELECT d.id, d.name, COALESCE(d.is_shared,false) AS is_shared, d.user_id=$1 AS is_owner, COUNT(c.id) AS card_count, COUNT(c.id) FILTER (WHERE r.due_at IS NULL OR r.due_at <= NOW()) AS due_count FROM decks d LEFT JOIN cards c ON c.deck_id=d.id LEFT JOIN card_reviews r ON r.card_id=c.id AND r.user_id=$1";
#[get("/deck")]
async fn decks(user: AuthUser, pool: &State<PgPool>) -> Result<Json<Vec<Deck>>, Status> {
    let query = format!("{DECK_QUERY} WHERE d.user_id=$1 GROUP BY d.id ORDER BY d.name");
    Ok(Json(
        sqlx::query_as::<_, Deck>(&query)
            .bind(user.user_id)
            .fetch_all(pool.inner())
            .await
            .map_err(db_error)?,
    ))
}
#[get("/deck/shared", rank = 1)]
async fn shared(user: AuthUser, pool: &State<PgPool>) -> Result<Json<Vec<Deck>>, Status> {
    let query =
        format!("{DECK_QUERY} WHERE d.is_shared=true GROUP BY d.id ORDER BY d.name LIMIT 200");
    Ok(Json(
        sqlx::query_as::<_, Deck>(&query)
            .bind(user.user_id)
            .fetch_all(pool.inner())
            .await
            .map_err(db_error)?,
    ))
}
#[get("/deck/<id>", rank = 2)]
async fn get_deck(id: &str, user: AuthUser, pool: &State<PgPool>) -> Result<Json<Deck>, Status> {
    let query =
        format!("{DECK_QUERY} WHERE d.id=$2 AND (d.user_id=$1 OR d.is_shared=true) GROUP BY d.id");
    sqlx::query_as::<_, Deck>(&query)
        .bind(user.user_id)
        .bind(id)
        .fetch_optional(pool.inner())
        .await
        .map_err(db_error)?
        .map(Json)
        .ok_or(Status::NotFound)
}
async fn can_access(pool: &PgPool, user: &str, deck: &str, owner_only: bool) -> Result<(), Status> {
    let allowed: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM decks WHERE id=$1 AND (user_id=$2 OR (is_shared=true AND NOT $3)))").bind(deck).bind(user).bind(owner_only).fetch_one(pool).await.map_err(db_error)?;
    if allowed {
        Ok(())
    } else {
        Err(Status::NotFound)
    }
}
#[post("/deck/new", data = "<data>")]
async fn new_deck(
    data: Json<DeckInput>,
    user: AuthUser,
    pool: &State<PgPool>,
) -> Result<Json<Deck>, Status> {
    if !valid_name(&data.name) {
        return Err(Status::BadRequest);
    }
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO decks(id,name,user_id,is_shared) VALUES($1,$2,$3,$4)")
        .bind(&id)
        .bind(data.name.trim())
        .bind(&user.user_id)
        .bind(data.is_shared)
        .execute(pool.inner())
        .await
        .map_err(db_error)?;
    get_deck(&id, user, pool).await
}
#[put("/deck/<id>", data = "<data>")]
async fn update_deck(
    id: &str,
    data: Json<DeckInput>,
    user: AuthUser,
    pool: &State<PgPool>,
) -> Result<Json<Deck>, Status> {
    if !valid_name(&data.name) {
        return Err(Status::BadRequest);
    }
    let result = sqlx::query("UPDATE decks SET name=$1,is_shared=$2 WHERE id=$3 AND user_id=$4")
        .bind(data.name.trim())
        .bind(data.is_shared)
        .bind(id)
        .bind(&user.user_id)
        .execute(pool.inner())
        .await
        .map_err(db_error)?;
    if result.rows_affected() == 0 {
        return Err(Status::NotFound);
    }
    get_deck(id, user, pool).await
}
#[delete("/deck/<id>")]
async fn delete_deck(id: &str, user: AuthUser, pool: &State<PgPool>) -> Result<Status, Status> {
    let mut tx = pool.begin().await.map_err(db_error)?;
    // Lock the parent to serialize deletion with card inserts, including legacy schemas.
    let owned = sqlx::query("SELECT id FROM decks WHERE id=$1 AND user_id=$2 FOR UPDATE")
        .bind(id)
        .bind(&user.user_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db_error)?;
    if owned.is_none() {
        return Err(Status::NotFound);
    }
    sqlx::query(
        "DELETE FROM card_reviews WHERE card_id IN (SELECT id FROM cards WHERE deck_id=$1)",
    )
    .bind(id)
    .execute(&mut *tx)
    .await
    .map_err(db_error)?;
    sqlx::query("DELETE FROM cards WHERE deck_id=$1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_error)?;
    sqlx::query("DELETE FROM decks WHERE id=$1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_error)?;
    tx.commit().await.map_err(db_error)?;
    Ok(Status::NoContent)
}
#[get("/deck/<id>/card")]
async fn cards(id: &str, user: AuthUser, pool: &State<PgPool>) -> Result<Json<Vec<Card>>, Status> {
    can_access(pool, &user.user_id, id, false).await?;
    let mut result = sqlx::query_as::<_, Card>("SELECT c.id,c.front,c.back,(r.due_at IS NULL OR r.due_at<=NOW()) AS due,(EXTRACT(EPOCH FROM r.due_at)*1000)::bigint AS due_at,COALESCE(r.interval_days,0) AS interval_days FROM cards c LEFT JOIN card_reviews r ON r.card_id=c.id AND r.user_id=$1 WHERE c.deck_id=$2 ORDER BY c.id").bind(user.user_id).bind(id).fetch_all(pool.inner()).await.map_err(db_error)?;
    for card in &mut result {
        card.review_delays = utils::review_delays(card.interval_days);
    }
    Ok(Json(result))
}
#[post("/deck/<id>/card", data = "<data>")]
async fn add_card(
    id: &str,
    data: Json<CardInput>,
    user: AuthUser,
    pool: &State<PgPool>,
) -> Result<Json<Card>, Status> {
    if !valid_card(&data) {
        return Err(Status::BadRequest);
    }
    let card_id = Uuid::new_v4().to_string();
    let result = sqlx::query("INSERT INTO cards(id,front,back,deck_id) SELECT $1,$2,$3,id FROM decks WHERE id=$4 AND user_id=$5").bind(&card_id).bind(data.front.trim()).bind(data.back.trim()).bind(id).bind(user.user_id).execute(pool.inner()).await.map_err(db_error)?;
    if result.rows_affected() == 0 {
        return Err(Status::NotFound);
    }
    Ok(Json(Card {
        id: card_id,
        front: data.front.trim().into(),
        back: data.back.trim().into(),
        due: true,
        due_at: None,
        interval_days: 0,
        review_delays: utils::review_delays(0),
    }))
}
#[put("/deck/<id>/card/<card_id>", data = "<data>")]
async fn update_card(
    id: &str,
    card_id: &str,
    data: Json<CardInput>,
    user: AuthUser,
    pool: &State<PgPool>,
) -> Result<Status, Status> {
    if !valid_card(&data) {
        return Err(Status::BadRequest);
    }
    let result = sqlx::query("UPDATE cards SET front=$1,back=$2 WHERE id=$3 AND deck_id=$4 AND EXISTS(SELECT 1 FROM decks WHERE id=$4 AND user_id=$5)").bind(data.front.trim()).bind(data.back.trim()).bind(card_id).bind(id).bind(user.user_id).execute(pool.inner()).await.map_err(db_error)?;
    if result.rows_affected() == 0 {
        return Err(Status::NotFound);
    }
    Ok(Status::NoContent)
}
#[delete("/deck/<id>/card/<card_id>")]
async fn delete_card(
    id: &str,
    card_id: &str,
    user: AuthUser,
    pool: &State<PgPool>,
) -> Result<Status, Status> {
    let result = sqlx::query("DELETE FROM cards WHERE id=$1 AND deck_id=$2 AND EXISTS(SELECT 1 FROM decks WHERE id=$2 AND user_id=$3)").bind(card_id).bind(id).bind(user.user_id).execute(pool.inner()).await.map_err(db_error)?;
    if result.rows_affected() == 0 {
        return Err(Status::NotFound);
    }
    Ok(Status::NoContent)
}
#[post("/deck/<id>/card/<card_id>/review", data = "<data>")]
async fn review(
    id: &str,
    card_id: &str,
    data: Json<ReviewInput>,
    user: AuthUser,
    pool: &State<PgPool>,
) -> Result<Json<ReviewResult>, Status> {
    if utils::next_interval(0, &data.grade).is_none() {
        return Err(Status::BadRequest);
    }
    let mut tx = pool.begin().await.map_err(db_error)?;
    let accessible = sqlx::query("SELECT c.id FROM cards c JOIN decks d ON d.id=c.deck_id WHERE c.id=$1 AND d.id=$2 AND (d.user_id=$3 OR d.is_shared=true) FOR SHARE OF c,d").bind(card_id).bind(id).bind(&user.user_id).fetch_optional(&mut *tx).await.map_err(db_error)?;
    if accessible.is_none() {
        return Err(Status::NotFound);
    }
    sqlx::query("INSERT INTO card_reviews(user_id,card_id,review_count) VALUES($1,$2,0) ON CONFLICT DO NOTHING").bind(&user.user_id).bind(card_id).execute(&mut *tx).await.map_err(db_error)?;
    let (previous, due): (i32, bool) = sqlx::query_as(
        "SELECT interval_days,due_at<=clock_timestamp() FROM card_reviews WHERE user_id=$1 AND card_id=$2 FOR UPDATE",
    )
    .bind(&user.user_id)
    .bind(card_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(db_error)?;
    if !due {
        return Err(Status::Conflict);
    }
    let days = utils::next_interval(previous, &data.grade).ok_or(Status::BadRequest)?;
    let seconds = utils::review_delay(previous, &data.grade).ok_or(Status::BadRequest)?;
    let due_at: i64 = sqlx::query_scalar("UPDATE card_reviews SET interval_days=$1,due_at=clock_timestamp()+($2::int*INTERVAL '1 second'),reviewed_at=clock_timestamp(),review_count=review_count+1 WHERE user_id=$3 AND card_id=$4 RETURNING (EXTRACT(EPOCH FROM due_at)*1000)::bigint").bind(days).bind(seconds).bind(user.user_id).bind(card_id).fetch_one(&mut *tx).await.map_err(db_error)?;
    tx.commit().await.map_err(db_error)?;
    Ok(Json(ReviewResult {
        due_at,
        interval_days: days,
        delay_seconds: seconds,
    }))
}
#[get("/<path..>", rank = 20)]
async fn spa(path: PathBuf) -> Option<NamedFile> {
    // Unknown API paths must remain real 404s rather than returning index.html.
    if path
        .components()
        .next()
        .is_some_and(|p| p.as_os_str() == "api")
    {
        return None;
    }
    let dist = std::env::var("FRONTEND_DIST").unwrap_or_else(|_| "../frontend/dist".into());
    NamedFile::open(Path::new(&dist).join("index.html"))
        .await
        .ok()
}
#[launch]
async fn rocket() -> _ {
    dotenvy::dotenv().ok();
    let secret = std::env::var("JWT_SECRET")
        .expect("Set JWT_SECRET to a random secret of at least 32 bytes");
    assert!(
        secret.len() >= 32,
        "JWT_SECRET must contain at least 32 bytes"
    );
    let pool = db::connect(&std::env::var("DATABASE_URL").expect("Set DATABASE_URL"))
        .await
        .expect("Database connection failed");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Database migration failed");
    let allowed_origins = std::env::var("ALLOWED_ORIGINS").ok();
    let origins = allowed_origins.as_deref().unwrap_or("");
    let origins: Vec<&str> = origins
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .collect();
    let cors = CorsOptions {
        allowed_origins: AllowedOrigins::some_exact(&origins),
        allowed_methods: [
            Method::Get,
            Method::Post,
            Method::Put,
            Method::Delete,
            Method::Options,
        ]
        .into_iter()
        .map(From::from)
        .collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Content-Type"]),
        ..Default::default()
    }
    .to_cors()
    .expect("Invalid CORS configuration");
    let mut config = rocket::Config::figment();
    if let Ok(port) = std::env::var("PORT") {
        config = config.merge(("port", port.parse::<u16>().expect("PORT must be a number")));
    }
    let dist = std::env::var("FRONTEND_DIST").unwrap_or_else(|_| "../frontend/dist".into());
    let app = rocket::custom(config)
        .attach(headers::ResponseHeaders)
        .manage(pool)
        .manage(JwtSecret(secret))
        .manage(AuthThrottle::default())
        .mount(
            "/api",
            routes![
                health,
                register,
                login,
                decks,
                shared,
                get_deck,
                new_deck,
                update_deck,
                delete_deck,
                cards,
                add_card,
                update_card,
                delete_card,
                review
            ],
        )
        .mount("/", FileServer::from(dist).rank(10))
        .mount("/", routes![spa]);
    if allowed_origins.is_some() {
        app.attach(cors)
    } else {
        app
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn invalid_content_is_rejected() {
        assert!(!valid_name("  "));
        assert!(!valid_name(&"x".repeat(101)));
        assert!(valid_name("Languages"));
        assert!(!valid_card(&CardInput {
            front: "".into(),
            back: "answer".into()
        }));
    }
    #[test]
    fn authentication_attempts_are_bounded() {
        let throttle = AuthThrottle::default();
        for _ in 0..10 {
            assert!(throttle.allow("alice"));
        }
        assert!(!throttle.allow("alice"));
        assert!(throttle.allow("bob"));
    }
    #[sqlx::test(migrations = "./migrations")]
    async fn grades_persist_delays_and_wait_until_due(pool: PgPool) {
        use rocket::{
            http::{ContentType, Header},
            local::asynchronous::Client,
        };
        sqlx::query("INSERT INTO users(id,username,password) VALUES('student','student','test')")
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("INSERT INTO decks(id,name,user_id) VALUES('deck','Review','student')")
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query(
            "INSERT INTO cards(id,front,back,deck_id) VALUES('card','Question','Answer','deck')",
        )
        .execute(&pool)
        .await
        .unwrap();
        let token = utils::generate_token("student", "review-test-secret").unwrap();
        let auth = || Header::new("Authorization", format!("Bearer {token}"));
        let client = Client::tracked(
            rocket::build()
                .manage(pool.clone())
                .manage(JwtSecret("review-test-secret".into()))
                .mount("/api", routes![cards, review]),
        )
        .await
        .unwrap();
        for grade in ["again", "hard", "good", "easy"] {
            sqlx::query("INSERT INTO card_reviews(user_id,card_id,interval_days,due_at,review_count) VALUES('student','card',10,NOW()-INTERVAL '1 second',0) ON CONFLICT(user_id,card_id) DO UPDATE SET interval_days=10,due_at=NOW()-INTERVAL '1 second',review_count=0").execute(&pool).await.unwrap();
            let before: Vec<Card> = client
                .get("/api/deck/deck/card")
                .header(auth())
                .dispatch()
                .await
                .into_json()
                .await
                .unwrap();
            assert!(before[0].due);
            let expected = utils::review_delay(10, grade).unwrap();
            let payload = format!("{{\"grade\":\"{grade}\"}}");
            let response = client
                .post("/api/deck/deck/card/card/review")
                .header(auth())
                .header(ContentType::JSON)
                .body(&payload)
                .dispatch()
                .await;
            assert_eq!(response.status(), Status::Ok);
            let result: ReviewResult = response.into_json().await.unwrap();
            assert_eq!(result.delay_seconds, expected);
            let (remaining,count):(f64,i32)=sqlx::query_as("SELECT EXTRACT(EPOCH FROM due_at-clock_timestamp())::float8,review_count FROM card_reviews WHERE user_id='student' AND card_id='card'").fetch_one(&pool).await.unwrap();
            assert!((remaining - expected as f64).abs() < 5.0);
            assert_eq!(count, 1);
            let reopened: Vec<Card> = client
                .get("/api/deck/deck/card")
                .header(auth())
                .dispatch()
                .await
                .into_json()
                .await
                .unwrap();
            assert!(!reopened[0].due);
            assert_eq!(reopened[0].due_at, Some(result.due_at));
            assert_eq!(reopened[0].interval_days, result.interval_days);
            assert_eq!(
                client
                    .post("/api/deck/deck/card/card/review")
                    .header(auth())
                    .header(ContentType::JSON)
                    .body(&payload)
                    .dispatch()
                    .await
                    .status(),
                Status::Conflict
            );
            sqlx::query("UPDATE card_reviews SET due_at=NOW()-INTERVAL '1 second' WHERE user_id='student' AND card_id='card'").execute(&pool).await.unwrap();
            let ready: Vec<Card> = client
                .get("/api/deck/deck/card")
                .header(auth())
                .dispatch()
                .await
                .into_json()
                .await
                .unwrap();
            assert!(ready[0].due);
        }
    }
    #[sqlx::test(migrations = "./migrations")]
    async fn ownership_sharing_and_review_progress(pool: PgPool) {
        use rocket::{
            http::{ContentType, Header},
            local::asynchronous::Client,
        };
        for id in ["owner", "visitor"] {
            sqlx::query("INSERT INTO users(id,username,password) VALUES($1,$1,'unused-test-hash')")
                .bind(id)
                .execute(&pool)
                .await
                .unwrap();
        }
        let secret = "a-test-secret-that-is-long-enough-to-use";
        let owner_token = utils::generate_token("owner", secret).unwrap();
        let visitor_token = utils::generate_token("visitor", secret).unwrap();
        let owner = || Header::new("Authorization", format!("Bearer {owner_token}"));
        let visitor = || Header::new("Authorization", format!("Bearer {visitor_token}"));
        let app = rocket::build()
            .manage(pool.clone())
            .manage(JwtSecret(secret.into()))
            .manage(AuthThrottle::default())
            .mount(
                "/api",
                routes![
                    register,
                    login,
                    decks,
                    shared,
                    get_deck,
                    new_deck,
                    update_deck,
                    delete_deck,
                    cards,
                    add_card,
                    update_card,
                    delete_card,
                    review
                ],
            );
        let client = Client::tracked(app).await.unwrap();
        assert_eq!(
            client.get("/api/deck").dispatch().await.status(),
            Status::Unauthorized
        );
        assert_eq!(
            client.get("/api/rows").dispatch().await.status(),
            Status::NotFound
        );
        let deck: Deck = client
            .post("/api/deck/new")
            .header(owner())
            .header(ContentType::JSON)
            .body(r#"{"name":"Private facts"}"#)
            .dispatch()
            .await
            .into_json()
            .await
            .unwrap();
        let path = format!("/api/deck/{}", deck.id);
        assert_eq!(
            client
                .get(&path)
                .header(visitor())
                .dispatch()
                .await
                .status(),
            Status::NotFound
        );
        assert_eq!(
            client
                .get(format!("{path}/card"))
                .header(visitor())
                .dispatch()
                .await
                .status(),
            Status::NotFound
        );
        let card: Card = client
            .post(format!("{path}/card"))
            .header(owner())
            .header(ContentType::JSON)
            .body(r#"{"front":"Question","back":"Answer"}"#)
            .dispatch()
            .await
            .into_json()
            .await
            .unwrap();
        assert_eq!(
            client
                .put(&path)
                .header(visitor())
                .header(ContentType::JSON)
                .body(r#"{"name":"Stolen","is_shared":true}"#)
                .dispatch()
                .await
                .status(),
            Status::NotFound
        );
        let shared_deck: Deck = client
            .put(&path)
            .header(owner())
            .header(ContentType::JSON)
            .body(r#"{"name":"Shared facts","is_shared":true}"#)
            .dispatch()
            .await
            .into_json()
            .await
            .unwrap();
        assert!(shared_deck.is_shared);
        assert_eq!(
            client
                .get(&path)
                .header(visitor())
                .dispatch()
                .await
                .status(),
            Status::Ok
        );
        assert_eq!(
            client
                .delete(format!("{path}/card/{}", card.id))
                .header(visitor())
                .dispatch()
                .await
                .status(),
            Status::NotFound
        );
        let review_path = format!("{path}/card/{}/review", card.id);
        assert_eq!(
            client
                .post(&review_path)
                .header(visitor())
                .header(ContentType::JSON)
                .body(r#"{"grade":"good"}"#)
                .dispatch()
                .await
                .status(),
            Status::Ok
        );
        let visitor_cards: Vec<Card> = client
            .get(format!("{path}/card"))
            .header(visitor())
            .dispatch()
            .await
            .into_json()
            .await
            .unwrap();
        let owner_cards: Vec<Card> = client
            .get(format!("{path}/card"))
            .header(owner())
            .dispatch()
            .await
            .into_json()
            .await
            .unwrap();
        assert!(!visitor_cards[0].due);
        assert!(owner_cards[0].due);
        assert_eq!(
            client
                .post(&review_path)
                .header(owner())
                .header(ContentType::JSON)
                .body(r#"{"grade":"invalid"}"#)
                .dispatch()
                .await
                .status(),
            Status::BadRequest
        );
        // The URL works independently of navigation state, and new users can reuse a deck name.
        let duplicate_name = client
            .post("/api/deck/new")
            .header(visitor())
            .header(ContentType::JSON)
            .body(r#"{"name":"Shared facts"}"#)
            .dispatch()
            .await;
        assert_eq!(duplicate_name.status(), Status::Ok);
        assert_eq!(
            client
                .delete(&path)
                .header(owner())
                .dispatch()
                .await
                .status(),
            Status::NoContent
        );
        let reviews: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM card_reviews")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(reviews, 0);
    }
    #[sqlx::test(migrations = "./migrations")]
    async fn registration_login_and_validation(pool: PgPool) {
        use rocket::{http::ContentType, local::asynchronous::Client};
        let client = Client::tracked(
            rocket::build()
                .manage(pool)
                .manage(JwtSecret("test-secret-of-at-least-32-bytes-long".into()))
                .manage(AuthThrottle::default())
                .mount("/api", routes![register, login]),
        )
        .await
        .unwrap();
        assert_eq!(
            client
                .post("/api/register")
                .header(ContentType::JSON)
                .body(r#"{"username":"ab","password":"short"}"#)
                .dispatch()
                .await
                .status(),
            Status::BadRequest
        );
        let payload = r#"{"username":"learner","password":"a-test-password-123"}"#;
        let response: LoginResponse = client
            .post("/api/register")
            .header(ContentType::JSON)
            .body(payload)
            .dispatch()
            .await
            .into_json()
            .await
            .unwrap();
        assert!(!response.token.is_empty());
        assert_eq!(
            client
                .post("/api/register")
                .header(ContentType::JSON)
                .body(payload)
                .dispatch()
                .await
                .status(),
            Status::Conflict
        );
        assert_eq!(
            client
                .post("/api/login")
                .header(ContentType::JSON)
                .body(payload)
                .dispatch()
                .await
                .status(),
            Status::Ok
        );
        assert_eq!(
            client
                .post("/api/login")
                .header(ContentType::JSON)
                .body(r#"{"username":"learner","password":"wrong-password"}"#)
                .dispatch()
                .await
                .status(),
            Status::Unauthorized
        );
    }
}
