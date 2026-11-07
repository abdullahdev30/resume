from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, File, Form, UploadFile
from fastapi import HTTPException
import httpx
import json
from app.core.config import settings

from app.modules.auth.dependencies import CURRENT_REGISTERED_USER_DEPENDENCY
from app.modules.auth.schemas import UserResponse
from app.modules.persona.schemas import (
    Category,
    PersonaCreate,
    PersonaMetadata,
    PersonaPersonal,
    PersonaResponse,
    PersonaDetailsPrompt,
)
from app.modules.persona.service import PersonaService

from app.modules.billing.dependencies import require_subscription

router = APIRouter(
    dependencies=[Depends(require_subscription)], prefix="/personas", tags=["Persona"]
)


def get_persona_service():
    return PersonaService()


SERVICE = Depends(get_persona_service)
USER = CURRENT_REGISTERED_USER_DEPENDENCY


@router.post("/parse-details")
async def parse_persona_details(payload: PersonaDetailsPrompt, user: UserResponse = USER):
    del user
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="Persona AI is not configured. Set GEMINI_API_KEY on the server.")
    prompt = ("Extract only facts explicitly stated in this paragraph into JSON with keys "
              "personal (first_name,last_name,email,phone,professional_title,city,country,summary), "
              "experience (array of job_title,company_name,location,start_date,end_date,description), "
              "education (array of institute_name,degree,field_of_study,start_date,end_date,description), "
              "skills (array of name,category,level), projects (array of name,description,link), "
              "certificates (array of title,category,issue_date), and description. "
              "Use empty strings or arrays for missing information. Do not invent facts. Paragraph:\n" + payload.paragraph)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.post(url, params={"key": settings.gemini_api_key}, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            })
            response.raise_for_status()
            text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(text)
            if not isinstance(result, dict): raise ValueError("Expected JSON object")
            return result
    except (httpx.HTTPError, KeyError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Gemini could not extract persona details. Please try again.") from exc


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
