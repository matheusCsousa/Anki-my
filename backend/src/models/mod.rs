use jsonwebtoken::{DecodingKey, Validation, decode};
use rocket::{
    Request,
    http::Status,
    request::{FromRequest, Outcome},
    serde::{Deserialize, Serialize},
};

pub struct JwtSecret(pub String);
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}
pub struct AuthUser {
    pub user_id: String,
}
#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthUser {
    type Error = ();
    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, ()> {
        let Some(token) = request
            .headers()
            .get_one("Authorization")
            .and_then(|h| h.strip_prefix("Bearer "))
        else {
            return Outcome::Error((Status::Unauthorized, ()));
        };
        let Some(secret) = request.rocket().state::<JwtSecret>() else {
            return Outcome::Error((Status::InternalServerError, ()));
        };
        match decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.0.as_bytes()),
            &Validation::default(),
        ) {
            Ok(data) => Outcome::Success(AuthUser {
                user_id: data.claims.sub,
            }),
            Err(_) => Outcome::Error((Status::Unauthorized, ())),
        }
    }
}
#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Credentials {
    pub username: String,
    pub password: String,
}
#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct LoginResponse {
    pub token: String,
}
#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct DeckInput {
    pub name: String,
    #[serde(default)]
    pub is_shared: bool,
}
#[derive(Serialize, Deserialize, sqlx::FromRow)]
#[serde(crate = "rocket::serde")]
pub struct Deck {
    pub id: String,
    pub name: String,
    pub is_shared: bool,
    pub is_owner: bool,
    pub card_count: i64,
    pub due_count: i64,
}
#[derive(Serialize, Deserialize, sqlx::FromRow)]
#[serde(crate = "rocket::serde")]
pub struct Card {
    pub id: String,
    pub front: String,
    pub back: String,
    pub due: bool,
}
#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct CardInput {
    pub front: String,
    pub back: String,
}
#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct ReviewInput {
    pub grade: String,
}
