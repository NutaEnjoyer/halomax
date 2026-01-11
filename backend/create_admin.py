"""
Script to create default admin user
Run: python create_admin.py
"""
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


def create_admin():
    db = SessionLocal()

    # Check if admin already exists
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if existing_admin:
        print("Admin user already exists")
        return

    # Create admin user
    admin_user = User(
        username="admin",
        hashed_password=get_password_hash("admin"),
        is_active=True
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    print(f"Admin user created successfully!")
    print(f"Username: admin")
    print(f"Password: admin")
    print(f"IMPORTANT: Change the password in production!")

    db.close()


if __name__ == "__main__":
    create_admin()
