from fastapi import APIRouter

router = APIRouter()

@router.get("/cors-test")
async def test_cors():
    return {
        "message": "CORS配置成功",
        "headers": {"Access-Control-Allow-Origin": "http://localhost:5173"}
    }
