from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, File, Form, UploadFile

from app.modules.auth.dependencies import CURRENT_REGISTERED_USER_DEPENDENCY
from app.modules.auth.schemas import UserResponse
from app.modules.persona.schemas import (
    Category,
    PersonaCreate,
    PersonaMetadata,
    PersonaPersonal,
    PersonaResponse,
)
from app.modules.persona.service import PersonaService

router = APIRouter(prefix="/personas", tags=["Persona"])


def get_persona_service():
    return PersonaService()


SERVICE = Depends(get_persona_service)
USER = CURRENT_REGISTERED_USER_DEPENDENCY


@router.get("", response_model=list[PersonaResponse])
def list_personas(user: UserResponse = USER, service: PersonaService = SERVICE):
    return service.list(user.id)


@router.post("", response_model=PersonaResponse, status_code=201)
def create_persona(
    payload: PersonaCreate, user: UserResponse = USER, service: PersonaService = SERVICE
):
    return service.create(user.id, payload, account_user=user)


@router.get("/{persona_id}", response_model=PersonaResponse)
def get_persona(
    persona_id: UUID, user: UserResponse = USER, service: PersonaService = SERVICE
):
    return service.get(user.id, str(persona_id))


@router.put("/{persona_id}", response_model=PersonaResponse)
def rename_persona(
    persona_id: UUID,
    payload: PersonaMetadata,
    user: UserResponse = USER,
    service: PersonaService = SERVICE,
):
    return service.rename(user.id, str(persona_id), payload)


@router.delete("/{persona_id}")
async def delete_persona(
    persona_id: UUID, user: UserResponse = USER, service: PersonaService = SERVICE
):
    await service.delete(user.id, str(persona_id))
    return {"message": "Persona deleted. Existing resumes are unchanged."}


@router.put("/{persona_id}/personal", response_model=PersonaResponse)
def update_personal(
    persona_id: UUID,
    payload: PersonaPersonal,
    user: UserResponse = USER,
    service: PersonaService = SERVICE,
):
    return service.personal(user.id, str(persona_id), payload)


@router.post("/{persona_id}/avatar", response_model=PersonaResponse)
async def upload_avatar(
    persona_id: UUID,
    file: Annotated[UploadFile, File()],
    user: UserResponse = USER,
    service: PersonaService = SERVICE,
):
    return await service.avatar(user.id, str(persona_id), file)


@router.get("/{persona_id}/avatar/snapshot")
async def avatar_snapshot(
    persona_id: UUID, user: UserResponse = USER, service: PersonaService = SERVICE
):
    return await service.avatar_snapshot(user.id, str(persona_id))


@router.post(
    "/{persona_id}/{category}", response_model=PersonaResponse, status_code=201
)
def add_entry(
    persona_id: UUID,
    category: Category,
    payload: Annotated[dict[str, Any], Body()],
    user: UserResponse = USER,
    service: PersonaService = SERVICE,
):
    return service.entry(user.id, str(persona_id), category, payload)


@router.post(
    "/{persona_id}/certificates/upload", response_model=PersonaResponse, status_code=201
)
async def upload_certificate(
    persona_id: UUID,
    file: Annotated[UploadFile, File()],
    title: Annotated[str, Form()],
    category: Annotated[str | None, Form()] = None,
    field: Annotated[str | None, Form()] = None,
    issue_date: Annotated[str | None, Form()] = None,
    expiration_date: Annotated[str | None, Form()] = None,
    user: UserResponse = USER,
    service: PersonaService = SERVICE,
):
    return await service.certificate(
        user.id,
        str(persona_id),
        file,
        title,
        category,
        field,
        issue_date,
        expiration_date,
    )


@router.delete("/{persona_id}/avatar", response_model=PersonaResponse)
async def remove_avatar(
    persona_id: UUID, user: UserResponse = USER, service: PersonaService = SERVICE
):
    return await service.remove_avatar(user.id, str(persona_id))


@router.put("/{persona_id}/{category}/{item_id}", response_model=PersonaResponse)
async def update_entry(
    persona_id: UUID,
    category: Category,
    item_id: UUID,
    payload: Annotated[dict[str, Any], Body()],
    user: UserResponse = USER,
    service: PersonaService = SERVICE,
):
    old = service.repository.get(user.id, str(persona_id))
    previous = next(
        (
            entry
            for entry in old["data"].get(category, [])
            if entry["id"] == str(item_id)
        ),
        {},
    )
    result = service.entry(user.id, str(persona_id), category, payload, str(item_id))
    if (
        category == "certificates"
        and "file_url" in payload
        and previous.get("file_url") != payload["file_url"]
    ):
        await service.cleanup(user.id, str(persona_id), previous.get("file_url"))
    return result


@router.delete("/{persona_id}/{category}/{item_id}", response_model=PersonaResponse)
async def delete_entry(
    persona_id: UUID,
    category: Category,
    item_id: UUID,
    user: UserResponse = USER,
    service: PersonaService = SERVICE,
):
    row = service.repository.get(user.id, str(persona_id))
    old = next(
        (
            entry
            for entry in row["data"].get(category, [])
            if entry["id"] == str(item_id)
        ),
        {},
    )
    result = service.remove_entry(user.id, str(persona_id), category, str(item_id))
    if category == "certificates":
        await service.cleanup(user.id, str(persona_id), old.get("file_url"))
    return result
