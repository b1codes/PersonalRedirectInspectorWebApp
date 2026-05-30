import jwt
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings, Settings

# HTTPBearer security scheme automatically parses the Authorization header
security = HTTPBearer()

class Auth0TokenVerifier:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.jwks_url = f"https://{settings.auth0_domain}/.well-known/jwks.json"
        self.issuer = f"https://{settings.auth0_domain}/"
        self.audience = settings.auth0_audience
        self.algorithms = settings.auth0_algorithms
        self._jwks_cache = None

    def get_jwks(self) -> dict:
        """Fetches and caches the JSON Web Key Set from Auth0."""
        if not self._jwks_cache:
            try:
                response = requests.get(self.jwks_url, timeout=5)
                response.raise_for_status()
                self._jwks_cache = response.json()
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Unable to fetch authentication keys from Auth0: {str(e)}",
                )
        return self._jwks_cache

    def verify_token(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """Decodes and validates the JWT Bearer token using Auth0 public keys."""
        token = credentials.credentials
        jwks = self.get_jwks()

        try:
            # Unverified decode to extract the header and find the correct signing key (kid)
            unverified_header = jwt.get_unverified_header(token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token structure or format.",
            )

        rsa_key = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == unverified_header.get("kid"):
                rsa_key = {
                    "kty": key.get("kty"),
                    "kid": key.get("kid"),
                    "use": key.get("use"),
                    "n": key.get("n"),
                    "e": key.get("e"),
                }
                break

        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not find appropriate signing keys.",
            )

        try:
            # Verify and decode token claims using the public key from the JWKS
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=self.algorithms,
                audience=self.audience,
                issuer=self.issuer,
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired.",
            )
        except jwt.InvalidClaimsError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims. Please check issuer and audience.",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}",
            )

# FastAPI dependency to secure endpoints
def get_current_user(
    settings: Settings = Depends(get_settings),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validates token and returns the unique user ID (from Auth0 'sub' claim).
    Usage in route: current_user_id: str = Depends(get_current_user)
    """
    verifier = Auth0TokenVerifier(settings)
    payload = verifier.verify_token(credentials)
    
    # 'sub' contains the Auth0 user ID (e.g., 'auth0|12345678' or 'google-oauth2|12345678')
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identifier (sub) missing from token.",
        )
    return user_id
