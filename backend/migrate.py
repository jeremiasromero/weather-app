from app.database import engine
from sqlalchemy import text

def run_migration():
    try:
        with engine.connect() as conn:
            # We use an IF NOT EXISTS block or just try to add it and catch the duplicate column error
            try:
                conn.execute(text("ALTER TABLE weather_queries ADD COLUMN hourly_data JSON"))
                conn.execute(text("ALTER TABLE weather_queries ADD COLUMN wiki_thumbnail VARCHAR(1000)"))
                conn.commit()
                print("Columns added successfully.")
            except Exception as e:
                # If column already exists it will throw an error, which is fine
                if "already exists" in str(e):
                    print("Columns already exist, migration skipped.")
                else:
                    print(f"Migration error: {e}")
    except Exception as e:
        print(f"Failed to connect to db: {e}")

if __name__ == "__main__":
    run_migration()
