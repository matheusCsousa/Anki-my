use crate::models::Claims;
use chrono::{Duration, Utc};
use jsonwebtoken::{EncodingKey, Header, encode};

pub fn generate_token(user_id: &str, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let claims = Claims {
        sub: user_id.to_string(),
        exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

// A small interval scheduler for the first release; this is not Anki's FSRS algorithm.
pub fn next_interval(previous: i32, grade: &str) -> Option<i32> {
    let days = match grade {
        "again" => 0,
        "hard" => (previous as f64 * 1.2).ceil() as i32,
        "good" => previous.saturating_mul(2).max(3),
        "easy" => previous.saturating_mul(3).max(7),
        _ => return None,
    };
    Some(if grade == "again" {
        0
    } else {
        days.clamp(1, 365)
    })
}

pub fn review_delay(previous: i32, grade: &str) -> Option<i32> {
    next_interval(previous, grade).map(|days| if days == 0 { 60 } else { days * 86400 })
}
pub fn review_delays(previous: i32) -> crate::models::ReviewDelays {
    crate::models::ReviewDelays {
        again: review_delay(previous, "again").unwrap(),
        hard: review_delay(previous, "hard").unwrap(),
        good: review_delay(previous, "good").unwrap(),
        easy: review_delay(previous, "easy").unwrap(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn previews_match_saved_delays() {
        for previous in [0, 1, 10, 365] {
            let preview = review_delays(previous);
            for (grade, seconds) in [
                ("again", preview.again),
                ("hard", preview.hard),
                ("good", preview.good),
                ("easy", preview.easy),
            ] {
                assert_eq!(Some(seconds), review_delay(previous, grade));
                assert!(seconds > 0);
            }
        }
        assert_eq!(review_delay(0, "again"), Some(60));
        assert_eq!(review_delay(0, "hard"), Some(86400));
        assert_eq!(review_delay(0, "good"), Some(3 * 86400));
        assert_eq!(review_delay(0, "easy"), Some(7 * 86400));
    }
    #[test]
    fn grades_schedule_different_intervals() {
        assert_eq!(next_interval(0, "again"), Some(0));
        assert_eq!(next_interval(0, "hard"), Some(1));
        assert_eq!(next_interval(0, "good"), Some(3));
        assert_eq!(next_interval(0, "easy"), Some(7));
        assert_eq!(next_interval(10, "good"), Some(20));
        assert_eq!(next_interval(300, "easy"), Some(365));
        assert_eq!(next_interval(5, "invalid"), None);
    }
    #[test]
    fn signed_tokens_require_the_correct_secret() {
        let token = generate_token("user-1", "test-secret").unwrap();
        let valid = jsonwebtoken::decode::<Claims>(
            &token,
            &jsonwebtoken::DecodingKey::from_secret(b"test-secret"),
            &jsonwebtoken::Validation::default(),
        )
        .unwrap();
        assert_eq!(valid.claims.sub, "user-1");
        assert!(
            jsonwebtoken::decode::<Claims>(
                &token,
                &jsonwebtoken::DecodingKey::from_secret(b"other-secret"),
                &jsonwebtoken::Validation::default()
            )
            .is_err()
        );
    }
    #[test]
    fn expired_tokens_and_unexpected_algorithms_are_rejected() {
        let key = jsonwebtoken::EncodingKey::from_secret(b"test-secret");
        let expired = Claims {
            sub: "user-1".into(),
            exp: 1,
        };
        let token = jsonwebtoken::encode(&jsonwebtoken::Header::default(), &expired, &key).unwrap();
        assert!(
            jsonwebtoken::decode::<Claims>(
                &token,
                &jsonwebtoken::DecodingKey::from_secret(b"test-secret"),
                &jsonwebtoken::Validation::default()
            )
            .is_err()
        );
        let claims = Claims {
            sub: "user-1".into(),
            exp: (Utc::now() + Duration::hours(1)).timestamp() as usize,
        };
        let token = jsonwebtoken::encode(
            &jsonwebtoken::Header::new(jsonwebtoken::Algorithm::HS384),
            &claims,
            &key,
        )
        .unwrap();
        assert!(
            jsonwebtoken::decode::<Claims>(
                &token,
                &jsonwebtoken::DecodingKey::from_secret(b"test-secret"),
                &jsonwebtoken::Validation::default()
            )
            .is_err()
        );
    }
}
