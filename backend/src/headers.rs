use rocket::{
    Request, Response,
    fairing::{Fairing, Info, Kind},
    http::Header,
};
pub struct ResponseHeaders;
#[rocket::async_trait]
impl Fairing for ResponseHeaders {
    fn info(&self) -> Info {
        Info {
            name: "Browser response headers",
            kind: Kind::Response,
        }
    }
    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("X-Content-Type-Options", "nosniff"));
        response.set_header(Header::new("X-Frame-Options", "DENY"));
        response.set_header(Header::new("Referrer-Policy", "same-origin"));
        if request.uri().path().as_str().starts_with("/api/") {
            response.set_header(Header::new("Cache-Control", "no-store"));
        }
    }
}
