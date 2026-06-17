from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from contextlib import asynccontextmanager

from routes import auth, farmer, buyer, bookings, chat, notifications, pricing, flash_sales, admin
from sockets.chat_socket import sio
from scheduler.main_scheduler import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title="AgriMarket API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register HTTP Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(farmer.router, prefix="/api/farmer", tags=["Farmer"])
app.include_router(buyer.router, prefix="/api", tags=["Buyer"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["Pricing"])
app.include_router(flash_sales.router, prefix="/api/flash-sales", tags=["Flash Sales"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)


@app.get("/")
async def root():
    return {"message": "AgriMarket API is running"}