from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import FarmType, Species
from app.schemas import FarmTypeOut, SpeciesOut


router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/farm-types", response_model=list[FarmTypeOut])
def list_farm_types(db: Session = Depends(get_db)):
    farm_types = db.scalars(select(FarmType).order_by(FarmType.name)).all()
    return [FarmTypeOut.model_validate(item) for item in farm_types]


@router.get("/species", response_model=list[SpeciesOut])
def list_species(farm_type_id: int | None = None, db: Session = Depends(get_db)):
    query = select(Species).order_by(Species.name)
    if farm_type_id:
        query = query.where(Species.farm_type_id == farm_type_id)
    species = db.scalars(query).all()
    return [SpeciesOut.model_validate(item) for item in species]

