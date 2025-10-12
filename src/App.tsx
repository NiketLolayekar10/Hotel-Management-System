import { useState, useEffect } from "react";
import { supabase } from "./utils/supabase/client";
import { projectId, publicAnonKey } from "./utils/supabase/info";
import { Auth } from "./components/Auth";
import { RoomSearch } from "./components/RoomSearch";
import { MyBookings } from "./components/MyBookings";
import { AdminGuestManagement } from "./components/AdminGuestManagement";
import { AdminRoomManagement } from "./components/AdminRoomManagement";
import { AdminBookingOverview } from "./components/AdminBookingOverview";
import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "./components/ui/card";
import {
	Hotel,
	LogOut,
	Search,
	Calendar,
	Users,
	Settings,
	BarChart,
	Home,
	Info,
	Bell,
	CreditCard,
	HelpCircle,
	Moon,
	Sun,
	Loader2,
	ShieldCheck,
	UserCircle,
} from "lucide-react";
import { Badge } from "./components/ui/badge";
import { ThemeToggle } from "./components/ui/theme-toggle";

type View = "search" | "bookings";
type AdminView = "check-ins" | "rooms" | "bookings" | "dashboard";

function App() {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [view, setView] = useState<View>("search");
	const [adminView, setAdminView] = useState<AdminView>("dashboard");
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [initializing, setInitializing] = useState(true);
	const [initError, setInitError] = useState<string | null>(null);

	useEffect(() => {
		// Check for existing session
		const checkSession = async () => {
			try {
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();
				if (error) throw error;

				if (session?.access_token) {
					setAccessToken(session.access_token);

					// Check if user is admin
					const { data: userData, error: userError } = await supabase
						.from("user_profiles")
						.select("is_admin")
						.eq("user_id", session.user.id)
						.single();

					if (!userError && userData?.is_admin) {
						setIsAdmin(true);
					}
				}
			} catch (err) {
				console.error("Session check failed:", err);
			} finally {
				setInitializing(false);
			}
		};

		checkSession();
	}, []);

	useEffect(() => {
		// Initialize the database with sample data and admin account
		const initializeData = async () => {
			try {
				// Check if data already exists
				const { data: existingRooms } = await supabase
					.from("rooms")
					.select("id")
					.limit(1);

				if (existingRooms && existingRooms.length > 0) {
					console.log("Database already initialized");
					return;
				}

				console.log("Initializing database...");

				// Create admin account
				try {
					const { data: adminData, error: adminError } =
						await supabase.auth.admin.createUser({
							email: "admin@hotel.com",
							password: "admin123",
							user_metadata: { name: "Hotel Administrator", role: "admin" },
							email_confirm: true,
						});

					if (adminData?.user) {
						// Create admin profile
						const { error: profileError } = await supabase
							.from("user_profiles")
							.upsert({
								id: adminData.user.id,
								email: "admin@hotel.com",
								name: "Hotel Administrator",
								role: "admin",
							});

						if (!profileError) {
							console.log(
								"✓ Admin account created: admin@hotel.com / admin123"
							);
						}
					} else if (adminError) {
						if (
							adminError.message.includes("already") ||
							adminError.message.includes("exists")
						) {
							console.log("✓ Admin account already exists");
						} else {
							console.log("⚠ Admin creation error:", adminError.message);
						}
					}
				} catch (adminErr) {
					console.log("⚠ Admin creation exception:", adminErr);
				}

				// Create room types
				const roomTypes = [
					{
						id: "rt1",
						name: "Standard Room",
						description: "Comfortable room with essential amenities",
						price_per_night: 99,
						max_guests: 2,
						amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge"],
						image_url:
							"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
					},
					{
						id: "rt2",
						name: "Deluxe Room",
						description: "Spacious room with premium amenities",
						price_per_night: 159,
						max_guests: 3,
						amenities: [
							"WiFi",
							"TV",
							"Air Conditioning",
							"Mini Bar",
							"Coffee Maker",
							"Balcony",
						],
						image_url:
							"https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
					},
					{
						id: "rt3",
						name: "Suite",
						description: "Luxurious suite with separate living area",
						price_per_night: 249,
						max_guests: 4,
						amenities: [
							"WiFi",
							"TV",
							"Air Conditioning",
							"Mini Bar",
							"Coffee Maker",
							"Balcony",
							"Jacuzzi",
							"Living Room",
						],
						image_url:
							"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
					},
				];

				for (const roomType of roomTypes) {
					const { error } = await supabase.from("room_types").upsert(roomType);
					if (error) {
						console.log("Error creating room type:", error.message);
					}
				}

				// Create rooms
				const rooms = [
					// Standard rooms
					{
						id: "r101",
						room_number: "101",
						room_type_id: "rt1",
						status: "available",
						floor: 1,
					},
					{
						id: "r102",
						room_number: "102",
						room_type_id: "rt1",
						status: "available",
						floor: 1,
					},
					{
						id: "r103",
						room_number: "103",
						room_type_id: "rt1",
						status: "available",
						floor: 1,
					},
					{
						id: "r104",
						room_number: "104",
						room_type_id: "rt1",
						status: "available",
						floor: 1,
					},
					// Deluxe rooms
					{
						id: "r201",
						room_number: "201",
						room_type_id: "rt2",
						status: "available",
						floor: 2,
					},
					{
						id: "r202",
						room_number: "202",
						room_type_id: "rt2",
						status: "available",
						floor: 2,
					},
					{
						id: "r203",
						room_number: "203",
						room_type_id: "rt2",
						status: "available",
						floor: 2,
					},
					// Suites
					{
						id: "r301",
						room_number: "301",
						room_type_id: "rt3",
						status: "available",
						floor: 3,
					},
					{
						id: "r302",
						room_number: "302",
						room_type_id: "rt3",
						status: "available",
						floor: 3,
					},
				];

				for (const room of rooms) {
					const { error } = await supabase.from("rooms").upsert(room);
					if (error) {
						console.log("Error creating room:", error.message);
					}
				}

				console.log("✓ Database initialization complete");
			} catch (error) {
				console.error("Failed to initialize:", error);
				setInitError(
					error instanceof Error
						? error.message
						: "Unknown initialization error"
				);
			}
		};

		initializeData();
	}, []);

	const handleAuthSuccess = (token: string) => {
		setAccessToken(token);
		// Check if user is admin after successful auth
		checkUserRole();
	};

	const checkUserRole = async () => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { data: userData } = await supabase
				.from("user_profiles")
				.select("is_admin")
				.eq("user_id", user.id)
				.single();

			if (userData?.is_admin) {
				setIsAdmin(true);
			}
		} catch (error) {
			console.error("Error checking user role:", error);
		}
	};

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		setAccessToken(null);
		setIsAdmin(false);
		setView("search");
	};

	const handleBookingSuccess = () => {
		setRefreshTrigger((prev) => prev + 1);
		setView("bookings");
	};

	if (initializing) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
				<div className="text-center animate-scale-in">
					<div className="relative mb-8">
						<Hotel className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto animate-pulse" />
						<div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 blur-2xl rounded-full animate-ping"></div>
					</div>
					<h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
						LuxStay
					</h2>
					<div className="flex items-center gap-3 justify-center">
						<Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
						<p className="text-slate-600 dark:text-slate-300 text-lg">
							Initializing system...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!accessToken) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-6xl mx-auto">
						{/* Hero Section */}
						<div className="text-center mb-12">
							<div className="relative mb-8">
								<div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl rounded-full"></div>
								<div className="relative flex items-center justify-center gap-4 mb-6">
									<div className="relative">
										<Hotel className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-pulse" />
										<div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 blur-xl rounded-full animate-ping"></div>
									</div>
									<h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
										LuxStay
									</h1>
								</div>
								<p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-2 font-light">
									Modern Hotel Management System
								</p>
								<p className="text-slate-500 dark:text-slate-400 text-lg">
									Experience luxury and comfort with our seamless booking
									platform
								</p>
							</div>

							{initError && (
								<Alert
									variant="destructive"
									className="mb-8 max-w-2xl mx-auto border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50"
								>
									<AlertTitle className="text-red-800 dark:text-red-200">
										Initialization Error
									</AlertTitle>
									<AlertDescription className="text-red-700 dark:text-red-300">
										{initError}
									</AlertDescription>
								</Alert>
							)}

							{/* Feature Cards */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
								<div className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
									<div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative p-6">
										<div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-4 rounded-xl mb-4 w-fit">
											<UserCircle className="h-8 w-8 text-blue-700 dark:text-blue-300" />
										</div>
										<h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-2">
											Guest Portal
										</h3>
										<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
											Search and book rooms with our intuitive interface.
											Experience seamless reservations with real-time
											availability.
										</p>
									</div>
								</div>

								<div className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
									<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative p-6">
										<div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-4 rounded-xl mb-4 w-fit">
											<ShieldCheck className="h-8 w-8 text-indigo-700 dark:text-indigo-300" />
										</div>
										<h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-2">
											Admin Portal
										</h3>
										<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
											Complete hotel management with advanced analytics. Login
											with admin@hotel.com / admin123
										</p>
									</div>
								</div>

								<div className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
									<div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative p-6">
										<div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 p-4 rounded-xl mb-4 w-fit">
											<HelpCircle className="h-8 w-8 text-purple-700 dark:text-purple-300" />
										</div>
										<h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-2">
											Secure Storage
										</h3>
										<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
											All data is securely stored in Supabase database with
											enterprise-grade security and reliability.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Auth Tabs */}
						<div className="max-w-md mx-auto animate-scale-in">
							<Tabs defaultValue="guest" className="w-full">
								<TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
									<TabsTrigger
										value="guest"
										onClick={() => setIsAdmin(false)}
										className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
									>
										<UserCircle className="w-4 h-4 mr-2" />
										<span>Guest Portal</span>
									</TabsTrigger>
									<TabsTrigger
										value="admin"
										onClick={() => setIsAdmin(true)}
										className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
									>
										<ShieldCheck className="w-4 h-4 mr-2" />
										<span>Admin Portal</span>
									</TabsTrigger>
								</TabsList>
								<TabsContent value="guest" className="mt-6">
									<Card className="border-none shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm overflow-hidden">
										<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
										<CardHeader className="relative">
											<CardTitle className="text-xl text-center text-slate-900 dark:text-slate-100">
												Welcome Back
											</CardTitle>
											<CardDescription className="text-center text-slate-600 dark:text-slate-400">
												Sign in to book your perfect stay
											</CardDescription>
										</CardHeader>
										<CardContent className="relative">
											<Auth onAuthSuccess={handleAuthSuccess} isAdmin={false} />
										</CardContent>
									</Card>
								</TabsContent>
								<TabsContent value="admin" className="mt-6">
									<Card className="border-none shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm overflow-hidden">
										<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
										<CardHeader className="relative">
											<CardTitle className="text-xl text-center text-slate-900 dark:text-slate-100">
												Admin Access
											</CardTitle>
											<CardDescription className="text-center text-slate-600 dark:text-slate-400">
												Manage your hotel operations
											</CardDescription>
										</CardHeader>
										<CardContent className="relative">
											<Auth onAuthSuccess={handleAuthSuccess} isAdmin={true} />
										</CardContent>
									</Card>
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (isAdmin) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
				<nav className="bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-lg backdrop-blur-sm sticky top-0 z-10">
					<div className="container mx-auto px-4">
						<div className="flex items-center justify-between h-16">
							<div className="flex items-center gap-3">
								<div className="relative">
									<Hotel className="w-8 h-8 text-blue-600 dark:text-blue-400" />
									<div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 blur-lg rounded-full"></div>
								</div>
								<h1 className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
									LuxStay Admin
								</h1>
							</div>
							<div className="flex items-center gap-4">
								<Badge
									variant="outline"
									className="hidden sm:flex gap-1 items-center bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
								>
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<span className="text-xs font-medium">System Online</span>
								</Badge>
								<Button
									variant="ghost"
									size="icon"
									className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
								>
									<Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
								</Button>
								<ThemeToggle />
								<Separator orientation="vertical" className="h-6" />
								<Button
									onClick={handleSignOut}
									variant="outline"
									size="sm"
									className="gap-2 hover:bg-red-50 dark:hover:bg-red-950/50 hover:border-red-200 dark:hover:border-red-800"
								>
									<LogOut className="w-4 h-4" />
									<span>Sign Out</span>
								</Button>
							</div>
						</div>
					</div>
				</nav>

				<div className="container mx-auto px-4 py-6">
					<div className="flex flex-col lg:flex-row gap-6">
						{/* Sidebar */}
						<div className="lg:w-64 space-y-4">
							{/* Mobile view tabs */}
							<div className="flex overflow-x-auto gap-2 lg:hidden pb-2">
								<Button
									variant={adminView === "dashboard" ? "default" : "outline"}
									onClick={() => setAdminView("dashboard")}
									size="sm"
									className="whitespace-nowrap"
								>
									<BarChart className="w-4 h-4 mr-1" />
									Dashboard
								</Button>
								<Button
									variant={adminView === "check-ins" ? "default" : "outline"}
									onClick={() => setAdminView("check-ins")}
									size="sm"
									className="whitespace-nowrap"
								>
									<Users className="w-4 h-4 mr-1" />
									Check-ins
								</Button>
								<Button
									variant={adminView === "rooms" ? "default" : "outline"}
									onClick={() => setAdminView("rooms")}
									size="sm"
									className="whitespace-nowrap"
								>
									<Hotel className="w-4 h-4 mr-1" />
									Rooms
								</Button>
								<Button
									variant={adminView === "bookings" ? "default" : "outline"}
									onClick={() => setAdminView("bookings")}
									size="sm"
									className="whitespace-nowrap"
								>
									<Calendar className="w-4 h-4 mr-1" />
									Bookings
								</Button>
							</div>

							{/* Desktop sidebar */}
							{/* Desktop sidebar */}
							<div className="hidden lg:block">
								<Card className="border-none shadow-xl overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm animate-slide-in-left">
									<CardHeader className="pb-2 pt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
										<CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
											Main Navigation
										</CardTitle>
									</CardHeader>
									<CardContent className="p-0">
										<div className="space-y-1 p-2">
											<Button
												variant={
													adminView === "dashboard" ? "default" : "ghost"
												}
												onClick={() => setAdminView("dashboard")}
												className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 hover:translate-x-1"
											>
												<BarChart className="w-4 h-4 mr-2" />
												Dashboard
											</Button>
											<Button
												variant={
													adminView === "check-ins" ? "default" : "ghost"
												}
												onClick={() => setAdminView("check-ins")}
												className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-950/50 transition-all duration-200 hover:translate-x-1"
											>
												<Users className="w-4 h-4 mr-2" />
												Guest Check-ins
											</Button>
											<Button
												variant={adminView === "rooms" ? "default" : "ghost"}
												onClick={() => setAdminView("rooms")}
												className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all duration-200 hover:translate-x-1"
											>
												<Hotel className="w-4 h-4 mr-2" />
												Room Management
											</Button>
											<Button
												variant={adminView === "bookings" ? "default" : "ghost"}
												onClick={() => setAdminView("bookings")}
												className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all duration-200 hover:translate-x-1"
											>
												<Calendar className="w-4 h-4 mr-2" />
												All Bookings
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card
									className="border-none shadow-xl mt-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm animate-slide-in-left"
									style={{ animationDelay: "0.1s" }}
								>
									<CardHeader className="pb-2 pt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
										<CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
											System Status
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
												<span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
													Database
												</span>
												<Badge
													variant="outline"
													className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
												>
													<div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
													Online
												</Badge>
											</div>
											<div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
												<span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
													API
												</span>
												<Badge
													variant="outline"
													className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
												>
													<div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
													Online
												</Badge>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Main content */}
						<div className="flex-1">
							<Card className="border-none shadow-xl mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden animate-slide-in-right">
								<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
								<CardHeader className="pb-2 relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
									<div className="flex items-center justify-between">
										<CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
											{adminView === "dashboard" && "Dashboard Overview"}
											{adminView === "check-ins" && "Guest Check-ins"}
											{adminView === "rooms" && "Room Management"}
											{adminView === "bookings" && "All Bookings"}
										</CardTitle>
										<Badge
											variant="outline"
											className="bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"
										>
											{new Date().toLocaleDateString("en-US", {
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</Badge>
									</div>
									<CardDescription className="text-slate-600 dark:text-slate-400">
										{adminView === "dashboard" &&
											"Monitor key metrics and hotel performance"}
										{adminView === "check-ins" &&
											"Process arrivals and manage guest stays"}
										{adminView === "rooms" &&
											"Manage room inventory and availability"}
										{adminView === "bookings" &&
											"View and manage all reservations"}
									</CardDescription>
								</CardHeader>

								<CardContent className="relative">
									{adminView === "dashboard" && (
										<>
											<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
												<Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
													<CardContent className="pt-6">
														<div className="flex justify-between items-center">
															<div>
																<p className="text-sm font-medium text-blue-700 dark:text-blue-300">
																	Total Bookings
																</p>
																<p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
																	128
																</p>
															</div>
															<div className="bg-blue-500/20 dark:bg-blue-400/20 p-4 rounded-full">
																<Calendar className="h-8 w-8 text-blue-700 dark:text-blue-300" />
															</div>
														</div>
													</CardContent>
												</Card>
												<Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
													<CardContent className="pt-6">
														<div className="flex justify-between items-center">
															<div>
																<p className="text-sm font-medium text-green-700 dark:text-green-300">
																	Revenue
																</p>
																<p className="text-3xl font-bold text-green-900 dark:text-green-100">
																	$12,426
																</p>
															</div>
															<div className="bg-green-500/20 dark:bg-green-400/20 p-4 rounded-full">
																<CreditCard className="h-8 w-8 text-green-700 dark:text-green-300" />
															</div>
														</div>
													</CardContent>
												</Card>
												<Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
													<CardContent className="pt-6">
														<div className="flex justify-between items-center">
															<div>
																<p className="text-sm font-medium text-purple-700 dark:text-purple-300">
																	Occupancy Rate
																</p>
																<p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
																	78%
																</p>
															</div>
															<div className="bg-purple-500/20 dark:bg-purple-400/20 p-4 rounded-full">
																<Hotel className="h-8 w-8 text-purple-700 dark:text-purple-300" />
															</div>
														</div>
													</CardContent>
												</Card>
											</div>

											<div className="text-center py-8 animate-scale-in">
												<div className="relative mb-6">
													<Hotel className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto" />
													<div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 blur-2xl rounded-full"></div>
												</div>
												<h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">
													Welcome to Admin Dashboard
												</h2>
												<p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
													Manage your hotel operations efficiently with our
													modern interface
												</p>
												<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
													<Button
														variant="outline"
														onClick={() => setAdminView("check-ins")}
														className="h-auto py-6 flex-col gap-3 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
													>
														<Users className="w-8 h-8 text-green-600 dark:text-green-400" />
														<div className="text-center">
															<div className="font-semibold text-slate-900 dark:text-slate-100">
																Guest Check-ins
															</div>
															<p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
																Process today's arrivals
															</p>
														</div>
													</Button>
													<Button
														variant="outline"
														onClick={() => setAdminView("rooms")}
														className="h-auto py-6 flex-col gap-3 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
													>
														<Hotel className="w-8 h-8 text-purple-600 dark:text-purple-400" />
														<div className="text-center">
															<div className="font-semibold text-slate-900 dark:text-slate-100">
																Room Management
															</div>
															<p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
																Manage rooms and types
															</p>
														</div>
													</Button>
													<Button
														variant="outline"
														onClick={() => setAdminView("bookings")}
														className="h-auto py-6 flex-col gap-3 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
													>
														<Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" />
														<div className="text-center">
															<div className="font-semibold text-slate-900 dark:text-slate-100">
																All Bookings
															</div>
															<p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
																View and manage reservations
															</p>
														</div>
													</Button>
												</div>
											</div>
										</>
									)}
								</CardContent>
							</Card>

							{adminView === "check-ins" && (
								<AdminGuestManagement accessToken={accessToken} />
							)}
							{adminView === "rooms" && (
								<AdminRoomManagement accessToken={accessToken} />
							)}
							{adminView === "bookings" && (
								<AdminBookingOverview accessToken={accessToken} />
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
			<nav className="bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-lg backdrop-blur-sm sticky top-0 z-10">
				<div className="container mx-auto px-4">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center gap-3">
							<div className="relative">
								<Hotel className="w-8 h-8 text-blue-600 dark:text-blue-400" />
								<div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 blur-lg rounded-full"></div>
							</div>
							<h1 className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
								LuxStay Guest Portal
							</h1>
						</div>
						<div className="flex items-center gap-4">
							<Badge
								variant="outline"
								className="hidden sm:flex gap-1 items-center bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
							>
								<UserCircle className="h-3 w-3 text-blue-500" />
								<span className="text-xs font-medium">Guest</span>
							</Badge>
							<ThemeToggle />
							<div className="hidden sm:flex items-center bg-gray-100 dark:bg-slate-800 rounded-full p-1">
								<Button
									variant={view === "search" ? "default" : "ghost"}
									onClick={() => setView("search")}
									size="sm"
									className="rounded-full"
								>
									<Search className="w-4 h-4 mr-2" />
									Search
								</Button>
								<Button
									variant={view === "bookings" ? "default" : "ghost"}
									onClick={() => setView("bookings")}
									size="sm"
									className="rounded-full"
								>
									<Calendar className="w-4 h-4 mr-2" />
									Bookings
								</Button>
							</div>
							<Separator
								orientation="vertical"
								className="h-6 hidden sm:block"
							/>
							<Button
								onClick={handleSignOut}
								variant="outline"
								size="sm"
								className="gap-2 hover:bg-red-50 dark:hover:bg-red-950/50 hover:border-red-200 dark:hover:border-red-800"
							>
								<LogOut className="w-4 h-4" />
								<span>Sign Out</span>
							</Button>
						</div>
					</div>

					{/* Mobile navigation */}
					<div className="sm:hidden flex items-center justify-center pb-3">
						<div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-full p-1 w-full max-w-xs">
							<Button
								variant={view === "search" ? "default" : "ghost"}
								onClick={() => setView("search")}
								size="sm"
								className="flex-1 rounded-full"
							>
								<Search className="w-4 h-4 mr-2" />
								Search
							</Button>
							<Button
								variant={view === "bookings" ? "default" : "ghost"}
								onClick={() => setView("bookings")}
								size="sm"
								className="flex-1 rounded-full"
							>
								<Calendar className="w-4 h-4 mr-2" />
								Bookings
							</Button>
						</div>
					</div>
				</div>
			</nav>

			<div className="container mx-auto px-4 py-6">
				<Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
					<CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
								{view === "search" && "Find Your Perfect Room"}
								{view === "bookings" && "Your Reservations"}
							</CardTitle>
							<Badge
								variant="outline"
								className="bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"
							>
								{new Date().toLocaleDateString()}
							</Badge>
						</div>
						<CardDescription className="text-slate-600 dark:text-slate-400">
							{view === "search" &&
								"Browse available rooms and make reservations"}
							{view === "bookings" && "View and manage your current bookings"}
						</CardDescription>
					</CardHeader>

					<CardContent className="bg-white/50 dark:bg-slate-800/50">
						{view === "search" && (
							<RoomSearch
								accessToken={accessToken}
								onBookingSuccess={handleBookingSuccess}
							/>
						)}
						{view === "bookings" && (
							<MyBookings
								accessToken={accessToken}
								refreshTrigger={refreshTrigger}
							/>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default App;
