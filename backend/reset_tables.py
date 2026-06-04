from db import engine, Base
import models  # ensures models are registered

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("✅ Tables dropped and recreated with all columns")