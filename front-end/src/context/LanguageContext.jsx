import { createContext, useContext, useState, useEffect, useCallback } from "react";

const LANG_KEY = "rs_lang";
const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
];

const LanguageContext = createContext(null);

async function loadTranslations(lang) {
  try {
    const mod = await import(`../locales/${lang}.json`);
    return mod.default;
  } catch {
    const en = await import("../locales/en.json");
    return en.default;
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || "en");
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    loadTranslations(lang).then(setTranslations);
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const changeLanguage = useCallback((code) => {
    setLangState(code);
  }, []);

  const t = useCallback((key, params = {}) => {
    let val = translations[key];
    if (!val) {
      const fallback = FALLBACK_EN[key];
      val = fallback || key;
    }
    if (params && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, v);
      });
    }
    return val;
  }, [translations]);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, currentLang, changeLanguage, t, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

const FALLBACK_EN = {
  "app.name": "RaithuSethu", "app.tagline": "Farm-to-Market", "lang.label": "Language",
  "nav.dashboard": "Dashboard", "nav.myCrops": "My Crops", "nav.purchaseRequests": "Purchase Requests",
  "nav.buyerNeeds": "Buyer Needs", "nav.myBookings": "My Bookings", "nav.flashSales": "Flash Sales",
  "nav.marketplace": "Marketplace", "nav.myRequests": "My Requests", "nav.myRequirements": "My Requirements",
  "nav.messages": "Messages", "nav.notifications": "Notifications", "nav.farmers": "Farmers",
  "nav.buyers": "Buyers", "nav.analytics": "Analytics", "nav.signOut": "Sign Out",
  "nav.mainMenu": "Main Menu", "nav.administration": "Administration", "nav.tools": "Tools",
  "role.farmer": "Farmer", "role.buyer": "Buyer", "role.admin": "Admin", "role.member": "Member",
  "common.save": "Save", "common.cancel": "Cancel", "common.delete": "Delete", "common.edit": "Edit",
  "common.add": "Add", "common.create": "Create", "common.update": "Update", "common.search": "Search",
  "common.filter": "Filter", "common.loading": "Loading...", "common.saving": "Saving...",
  "common.uploading": "Uploading...", "common.upload": "Upload", "common.noData": "No data found",
  "common.confirm": "Confirm", "common.close": "Close", "common.back": "Back", "common.next": "Next",
  "common.submit": "Submit", "common.send": "Send", "common.actions": "Actions", "common.status": "Status",
  "common.typeHere": "Type here...", "common.optional": "Optional", "common.required": "Required",
  "common.or": "or",
  "crop.name": "Crop Name", "crop.category": "Category", "crop.quantity": "Quantity",
  "crop.unit": "Unit", "crop.price": "Price", "crop.pricePerUnit": "Price per Unit",
  "crop.description": "Description", "crop.location": "Location", "crop.harvestDate": "Harvest Date",
  "crop.expiryDate": "Expiry Date", "crop.images": "Images", "crop.chooseImage": "Choose Image",
  "crop.imagesSelected": "image(s) selected", "crop.status": "Status", "crop.noImage": "No image",
  "crop.category.vegetables": "Vegetables", "crop.category.fruits": "Fruits", "crop.category.grains": "Grains",
  "crop.category.dairy": "Dairy", "crop.category.spices": "Spices", "crop.category.pulses": "Pulses",
  "crop.category.others": "Others",
  "crop.unit.kg": "kg", "crop.unit.ton": "ton", "crop.unit.quintal": "quintal", "crop.unit.dozen": "dozen",
  "crop.unit.piece": "piece", "crop.unit.liter": "liter",
  "crop.status.active": "Active", "crop.status.sold": "Sold", "crop.status.expired": "Expired",
  "farmer.dashboard.title": "Farmer Dashboard", "farmer.dashboard.activeCrops": "Active Crops",
  "farmer.dashboard.totalRequests": "Total Requests", "farmer.dashboard.pendingBookings": "Pending Bookings",
  "farmer.dashboard.activeFlashSales": "Active Flash Sales", "farmer.dashboard.expiringSoon": "Expiring Soon",
  "farmer.dashboard.quickActions": "Quick Actions", "farmer.dashboard.addCrop": "Add New Crop",
  "farmer.dashboard.viewRequests": "View Requests", "farmer.dashboard.createFlashSale": "Create Flash Sale",
  "farmer.dashboard.noCropsYet": "No crops listed yet. Start by adding your first crop!",
  "farmer.crops.title": "My Crops", "farmer.crops.addCrop": "Add Crop", "farmer.crops.editCrop": "Edit Crop",
  "farmer.crops.publishCrop": "Publish Crop", "farmer.crops.updateCrop": "Update Crop",
  "farmer.crops.deleteCrop": "Delete Crop Listing",
  "farmer.crops.deleteConfirm": 'Are you sure you want to remove "{name}"? This action cannot be undone.',
  "farmer.crops.deleteSuccess": "Crop deleted successfully", "farmer.crops.saveSuccess": "Crop saved successfully",
  "farmer.crops.updateSuccess": "Crop updated successfully", "farmer.crops.nameRequired": "Crop name required",
  "farmer.crops.quantityRequired": "Valid quantity required", "farmer.crops.priceRequired": "Valid price required",
  "farmer.crops.locationRequired": "Location required", "farmer.crops.saveFailed": "Failed to save crop",
  "farmer.crops.noCropsFilter": "No crops match your filters", "farmer.crops.noCropsYet": "No crops listed yet",
  "farmer.crops.noCropsDesc": "Add your first crop to start receiving purchase requests from buyers.",
  "farmer.crops.addFirst": "Add Your First Crop",
  "farmer.crops.imageTypeError": "Only JPG, PNG, and WEBP images are allowed",
  "farmer.crops.imageSizeError": "Image must be under 5MB", "farmer.crops.imageUploadFailed": "Failed to upload image",
  "farmer.requests.title": "Purchase Requests", "farmer.requests.all": "All", "farmer.requests.pending": "Pending",
  "farmer.requests.accepted": "Accepted", "farmer.requests.rejected": "Rejected",
  "farmer.requests.noRequests": "No purchase requests yet",
  "farmer.requests.noRequestsDesc": "When buyers request your crops, they will appear here.",
  "farmer.requirements.title": "Buyer Needs", "farmer.requirements.noRequirements": "No buyer requirements yet",
  "farmer.requirements.noRequirementsDesc": "When buyers post their crop requirements, they will appear here.",
  "farmer.requirements.respond": "Respond", "farmer.requirements.responded": "Responded",
  "farmer.requirements.respondModal": "Respond to Requirement", "farmer.requirements.yourCrop": "Your Crop",
  "farmer.requirements.selectCrop": "Select a crop", "farmer.requirements.offerPrice": "Offer Price",
  "farmer.requirements.message": "Message (optional)", "farmer.requirements.responseSent": "Response sent successfully",
  "farmer.bookings.title": "My Bookings", "farmer.bookings.noBookings": "No bookings yet",
  "farmer.bookings.confirmed": "Confirmed", "farmer.bookings.pending": "Pending",
  "farmer.bookings.cancelled": "Cancelled", "farmer.bookings.completed": "Completed",
  "farmer.flashSales.title": "Flash Sales", "farmer.flashSales.create": "Create Flash Sale",
  "farmer.flashSales.edit": "Edit Flash Sale", "farmer.flashSales.noSales": "No flash sales active",
  "buyer.marketplace.title": "Marketplace", "buyer.marketplace.allCategories": "All Categories",
  "buyer.marketplace.allStatuses": "All Statuses", "buyer.marketplace.maxPrice": "Max Price",
  "buyer.marketplace.noCrops": "No crops found",
  "buyer.marketplace.noCropsDesc": "Try adjusting your search or filters.",
  "buyer.marketplace.requestCrop": "Request Crop", "buyer.marketplace.requestSent": "Purchase request sent!",
  "buyer.marketplace.requestFailed": "Failed to send request", "buyer.marketplace.quantity": "Quantity needed",
  "buyer.marketplace.proposedPrice": "Proposed Price", "buyer.marketplace.message": "Message (optional)",
  "buyer.marketplace.sendRequest": "Send Request",
  "buyer.requests.title": "My Requests", "buyer.requests.noRequests": "No requests yet",
  "buyer.requests.noRequestsDesc": "Request crops from the marketplace to see them here.",
  "buyer.requests.status": "Status", "buyer.requests.accepted": "Accepted", "buyer.requests.rejected": "Rejected",
  "buyer.requests.pending": "Pending",
  "buyer.requirements.title": "My Requirements", "buyer.requirements.create": "Create Requirement",
  "buyer.requirements.edit": "Edit Requirement", "buyer.requirements.cropName": "Crop Name",
  "buyer.requirements.category": "Category", "buyer.requirements.quantity": "Quantity",
  "buyer.requirements.unit": "Unit", "buyer.requirements.description": "Description",
  "buyer.requirements.location": "Location", "buyer.requirements.targetPrice": "Target Price",
  "buyer.requirements.deadline": "Deadline", "buyer.requirements.noRequirements": "No requirements yet",
  "buyer.requirements.requirementsDesc": "Post your crop requirements so farmers can reach out to you.",
  "buyer.requirements.createFirst": "Create Your First Requirement",
  "buyer.requirements.nameRequired": "Crop name is required",
  "buyer.requirements.quantityRequired": "Valid quantity is required",
  "buyer.requirements.priceRequired": "Valid target price is required",
  "buyer.requirements.saveSuccess": "Requirement saved successfully",
  "buyer.requirements.saveFailed": "Failed to save requirement",
  "buyer.requirements.deleteConfirm": "Are you sure you want to delete this requirement?",
  "buyer.requirements.respondedBy": "Responded By", "buyer.requirements.message": "Message",
  "buyer.requirements.offeredPrice": "Offered Price", "buyer.requirements.viewResponses": "View Responses",
  "buyer.requirements.noResponses": "No responses yet",
  "buyer.bookings.title": "My Bookings", "buyer.bookings.noBookings": "No bookings yet",
  "chat.title": "Messages", "chat.search": "Search chats...", "chat.noConvs": "No conversations found",
  "chat.noMessages": "No messages yet", "chat.placeholder": "Type your message...",
  "chat.sayHello": "Say hello to {name}!", "chat.discuss": "Discuss crop details, pricing, and delivery.",
  "chat.selectConv": "Select a conversation from the sidebar or start a new chat from the marketplace.",
  "chat.yourMessages": "Your Messages", "chat.recording": "Recording...", "chat.voiceMsg": "Voice message",
  "chat.speechToText": "Speech to text",
  "chat.voiceNotSupported": "Voice recording is not supported in your browser",
  "chat.speechNotSupported": "Speech recognition is not supported in your browser",
  "chat.listening": "Listening...", "chat.online": "Online",
  "notifications.title": "Notifications", "notifications.empty": "No notifications yet",
  "notifications.markRead": "Mark as read", "notifications.markAllRead": "Mark all as read",
  "notifications.requestAccepted": "Your purchase request for {crop} has been accepted!",
  "notifications.requestRejected": "Your purchase request for {crop} has been rejected.",
  "auth.login": "Login", "auth.register": "Register", "auth.email": "Email", "auth.password": "Password",
  "auth.confirmPassword": "Confirm Password", "auth.name": "Full Name", "auth.phone": "Phone Number",
  "auth.role": "I want to join as", "auth.forgotPassword": "Forgot Password?",
  "auth.resetPassword": "Reset Password", "auth.alreadyAccount": "Already have an account?",
  "auth.noAccount": "Don't have an account?", "auth.loginSuccess": "Login successful!",
  "auth.registerSuccess": "Registration successful!", "auth.logoutSuccess": "Logged out successfully",
  "auth.invalidCredentials": "Invalid email or password",
  "admin.dashboard.title": "Admin Dashboard", "admin.dashboard.totalFarmers": "Total Farmers",
  "admin.dashboard.totalBuyers": "Total Buyers", "admin.dashboard.totalCrops": "Total Crops",
  "admin.dashboard.totalTransactions": "Total Transactions", "admin.farmers.title": "Manage Farmers",
  "admin.buyers.title": "Manage Buyers", "admin.analytics.title": "Analytics",
  "landing.title": "Farm fresh, directly from the source",
  "landing.subtitle": "RaithuSethu connects farmers directly with buyers, eliminating middlemen for better prices.",
  "landing.getStarted": "Get Started", "landing.learnMore": "Learn More",
  "error.generic": "Something went wrong", "error.network": "Network error. Please check your connection.",
  "error.unauthorized": "Unauthorized. Please login again.", "error.notFound": "Page not found",
  "error.notFoundDesc": "The page you are looking for does not exist.", "error.goHome": "Go Home",
  "success.generic": "Operation completed successfully",
};
