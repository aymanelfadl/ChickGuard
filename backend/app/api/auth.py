from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import (
    TokenResponse,
    UserLoginCreate,
    UserMe,
    UserPublic,
    UserRegisterAck,
    UserRegisterCreate,
)
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserRegisterAck)
def register_user(
    payload: UserRegisterCreate,
    db: Session = Depends(get_db),
) -> UserRegisterAck:
    user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role="admin",
        is_active=True,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        ) from error

    db.refresh(user)
    return UserRegisterAck(
        status="success",
        message="User registered",
        user=UserPublic.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login_user(
    payload: UserLoginCreate,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    token = create_access_token({"sub": user.email, "user_id": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserPublic.model_validate(user),
    )


@router.get("/me", response_model=UserMe)
def get_me(current_user: models.User = Depends(get_current_user)) -> models.User:
    return current_user
