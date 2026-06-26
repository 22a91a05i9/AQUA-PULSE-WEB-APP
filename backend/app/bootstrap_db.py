from app.db import Base, SessionLocal, engine
from app.schema_patches import apply_schema_patches
from app.seed_data import seed_database


def main() -> None:
    Base.metadata.create_all(bind=engine)
    apply_schema_patches(engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    print("database-bootstrap-ok")


if __name__ == "__main__":
    main()
