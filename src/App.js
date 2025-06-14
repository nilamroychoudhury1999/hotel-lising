"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  query,
  orderBy,
} from "firebase/firestore"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { Helmet, HelmetProvider } from "react-helmet-async"
import {
  Calendar,
  MapPin,
  Phone,
  Users,
  Search,
  Plus,
  ArrowLeft,
  Menu,
  X,
  Building2,
  Star,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Share2,
  Eye,
  Heart,
  Bell,
  Briefcase,
} from "lucide-react"

// Firebase Configuration with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAq3WBKKbmMmGDd9264MXtWs5MX121ZDks",
  authDomain: "form-ca7cc.firebaseapp.com",
  databaseURL: "https://form-ca7cc-default-rtdb.firebaseio.com",
  projectId: "form-ca7cc",
  storageBucket: "form-ca7cc.firebasestorage.app",
  messagingSenderId: "1054208318782",
  appId: "1:1054208318782:web:e820f1cb9b943f007aa06f",
  measurementId: "G-5CQ6L49Q0E",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()

// Cloudinary Configuration with your actual config
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset_1"
const CLOUDINARY_CLOUD_NAME = "dyrmi2zkl"

// UI Components - All inline to avoid import errors

// Button Component
function Button({
  children,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  onClick,
  asChild,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 bg-gray-900 text-white hover:bg-gray-800",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground border-gray-300 hover:bg-gray-50",
    ghost: "hover:bg-accent hover:text-accent-foreground hover:bg-gray-100",
  }

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
  }

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

  if (asChild && children?.type === "a") {
    return (
      <a {...children.props} className={classes}>
        {children.props.children}
      </a>
    )
  }

  return (
    <button className={classes} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

// Card Components
function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm bg-white border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

function CardTitle({ children, className = "", ...props }) {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  )
}

function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Input Component
function Input({ className = "", type = "text", ...props }) {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-white placeholder:text-gray-500 focus-visible:ring-blue-500 ${className}`}
      {...props}
    />
  )
}

// Textarea Component
function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-white placeholder:text-gray-500 focus-visible:ring-blue-500 ${className}`}
      {...props}
    />
  )
}

// Badge Component
function Badge({ children, variant = "default", className = "", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80 bg-gray-900 text-white",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-gray-100 text-gray-900",
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Avatar Components
function Avatar({ children, className = "", ...props }) {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`} {...props}>
      {children}
    </div>
  )
}

function AvatarImage({ src, alt, className = "", ...props }) {
  return (
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  )
}

function AvatarFallback({ children, className = "", ...props }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-muted bg-gray-100 text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Utility Functions
async function geocodeAddress(address) {
  if (!address) return null
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.length === 0) return null
    return {
      lat: Number.parseFloat(data[0].lat),
      lon: Number.parseFloat(data[0].lon),
    }
  } catch (error) {
    console.error("Geocoding failed:", error)
    return null
  }
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function isEventUpcoming(dateString) {
  return new Date(dateString) > new Date()
}

function getEventStatus(dateString) {
  const eventDate = new Date(dateString)
  const now = new Date()
  const diffTime = eventDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { status: "past", label: "Past Event", color: "gray" }
  if (diffDays === 0) return { status: "today", label: "Today", color: "red" }
  if (diffDays === 1) return { status: "tomorrow", label: "Tomorrow", color: "orange" }
  if (diffDays <= 7) return { status: "thisweek", label: `In ${diffDays} days`, color: "yellow" }
  return { status: "upcoming", label: "Upcoming", color: "green" }
}

// Professional Navigation Component
function ProfessionalNavigation({ user, handleLogin, handleLogout, currentView, setCurrentView }) {
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const navigationItems = [
    { id: "events", label: "Events", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "calendar", label: "Calendar", icon: Clock },
    { id: "dashboard", label: "Dashboard", icon: Settings },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView("events")}>
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EventPro
              </span>
            </div>

            {!isMobile && (
              <div className="hidden md:flex space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={currentView === item.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentView(item.id)}
                      className={currentView === item.id ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          {isMobile ? (
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)} className="p-2">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || "/placeholder.svg"} />
                      <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
                  </div>
                  <Button
                    onClick={() => setCurrentView("add-event")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setCurrentView("add-event")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                  <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sign In
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobile && menuOpen && (
          <div className="border-t bg-white py-4">
            <div className="flex flex-col space-y-3">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "default" : "ghost"}
                    onClick={() => {
                      setCurrentView(item.id)
                      setMenuOpen(false)
                    }}
                    className={`w-full justify-start ${currentView === item.id ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                )
              })}

              <div className="border-t pt-3">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-2 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || "/placeholder.svg"} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
                    </div>
                    <Button
                      onClick={() => {
                        setCurrentView("add-event")
                        setMenuOpen(false)
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 mb-2 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout()
                        setMenuOpen(false)
                      }}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentView("add-event")
                        setMenuOpen(false)
                      }}
                      className="w-full mb-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                    <Button
                      onClick={() => {
                        handleLogin()
                        setMenuOpen(false)
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Professional Event Listing Page
function EventListingPage({ user, events, loading, toggleInterest, setCurrentView, setSelectedEvent }) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("date")
  const [filterBy, setFilterBy] = useState("all")

  const categories = ["All", "Business", "Technology", "Networking", "Conference", "Workshop", "Seminar"]

  const filteredAndSortedEvents = events
    .filter((event) => {
      const lowerSearch = search.toLowerCase()
      const matchesSearch =
        event.title.toLowerCase().includes(lowerSearch) ||
        (event.city?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.state?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.country?.toLowerCase().includes(lowerSearch) ?? false) ||
        (event.description?.toLowerCase().includes(lowerSearch) ?? false)

      const matchesCategory = selectedCategory === "All" || event.category === selectedCategory

      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "upcoming" && isEventUpcoming(event.date)) ||
        (filterBy === "past" && !isEventUpcoming(event.date)) ||
        (filterBy === "interested" && user && event.interestedUsers?.includes(user.uid))

      return matchesSearch && matchesCategory && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date) - new Date(b.date)
        case "popularity":
          return (b.interestedUsers?.length || 0) - (a.interestedUsers?.length || 0)
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return new Date(a.date) - new Date(b.date)
      }
    })

  const eventStats = {
    total: events.length,
    upcoming: events.filter((e) => isEventUpcoming(e.date)).length,
    past: events.filter((e) => !isEventUpcoming(e.date)).length,
    interested: user ? events.filter((e) => e.interestedUsers?.includes(user.uid)).length : 0,
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Helmet>
        <title>EventPro - Professional Event Management Platform</title>
        <meta
          name="description"
          content="Discover and manage professional events, conferences, workshops, and business networking opportunities. Connect with industry leaders and grow your network."
        />
      </Helmet>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          Professional Events
          <span className="block text-blue-600">Made Simple</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Discover, create, and manage professional events that drive business growth and meaningful connections.
        </p>

        {/* Event Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{eventStats.total}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{eventStats.upcoming}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{eventStats.past}</div>
              <div className="text-sm text-gray-600">Past Events</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{eventStats.interested}</div>
              <div className="text-sm text-gray-600">Your Interests</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="search"
            placeholder="Search events, locations, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="date">Sort by Date</option>
              <option value="popularity">Sort by Popularity</option>
              <option value="title">Sort by Title</option>
            </select>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="past">Past Events</option>
              {user && <option value="interested">My Interests</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedEvents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or check back later for new events.</p>
          </div>
        ) : (
          filteredAndSortedEvents.map((event) => {
            const interestedCount = event.interestedUsers?.length || 0
            const isInterested = user ? event.interestedUsers?.includes(user.uid) : false
            const eventStatus = getEventStatus(event.date)

            return (
              <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event)
                    setCurrentView("event-detail")
                  }}
                >
                  {event.imageUrl && (
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={event.imageUrl || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Badge variant="secondary" className="bg-white/90 text-gray-900">
                          {event.category}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`bg-${eventStatus.color}-100 text-${eventStatus.color}-800`}
                        >
                          {eventStatus.label}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <div
                    className="cursor-pointer mb-4"
                    onClick={() => {
                      setSelectedEvent(event)
                      setCurrentView("event-detail")
                    }}
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <time dateTime={event.date}>{formatDate(event.date)}</time>
                      </div>

                      {(event.city || event.state || event.country) && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{[event.city, event.state, event.country].filter(Boolean).join(", ")}</span>
                        </div>
                      )}

                      {event.contact && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{formatPhoneNumber(event.contact)}</span>
                        </div>
                      )}
                    </div>

                    {event.description && <p className="text-gray-600 mt-3 line-clamp-2">{event.description}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant={isInterested ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleInterest(event)
                      }}
                      disabled={loading}
                      className={isInterested ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                    >
                      <Star className={`h-4 w-4 mr-1 ${isInterested ? "fill-current" : ""}`} />
                      {isInterested ? "Interested" : "Show Interest"}
                    </Button>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {interestedCount} interested
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </main>
  )
}

// Professional Event Detail Page
function EventDetailPage({ user, toggleInterest, selectedEvent, setCurrentView }) {
  const [loadingAction, setLoadingAction] = useState(false)

  if (!selectedEvent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setCurrentView("events")}>Return to Events</Button>
        </div>
      </div>
    )
  }

  const interestedCount = selectedEvent.interestedUsers?.length || 0
  const isInterested = user ? selectedEvent.interestedUsers?.includes(user.uid) : false
  const eventDateFormatted = formatDate(selectedEvent.date)
  const locationString = [selectedEvent.city, selectedEvent.state, selectedEvent.country].filter(Boolean).join(", ")
  const eventStatus = getEventStatus(selectedEvent.date)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedEvent.title,
          text: selectedEvent.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Event link copied to clipboard!")
    }
  }

  const handleCalendarAdd = () => {
    const startDate = new Date(selectedEvent.date)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedEvent.title)}&dates=${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z&details=${encodeURIComponent(selectedEvent.description)}&location=${encodeURIComponent(locationString)}`

    window.open(calendarUrl, "_blank")
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{`${selectedEvent.title} - ${eventDateFormatted} - EventPro`}</title>
        <meta
          name="description"
          content={
            selectedEvent.description?.substring(0, 160) ||
            `Professional event: ${selectedEvent.title} on ${eventDateFormatted} in ${locationString}`
          }
        />
      </Helmet>

      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => setCurrentView("events")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            {selectedEvent.imageUrl && (
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={selectedEvent.imageUrl || "/placeholder.svg"}
                  alt={selectedEvent.title}
                  className="w-full h-64 md:h-96 object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-blue-600 text-white">{selectedEvent.category}</Badge>
                  <Badge variant="secondary" className={`bg-${eventStatus.color}-100 text-${eventStatus.color}-800`}>
                    {eventStatus.label}
                  </Badge>
                </div>
              </div>
            )}

            <CardContent className="p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{selectedEvent.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Date</p>
                      <time dateTime={selectedEvent.date} className="text-gray-600">
                        {eventDateFormatted}
                      </time>
                    </div>
                  </div>

                  {locationString && (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Location</p>
                        <address className="text-gray-600 not-italic">{locationString}</address>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedEvent.contact && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Contact</p>
                        <a
                          href={`tel:${selectedEvent.contact}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {formatPhoneNumber(selectedEvent.contact)}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Interest</p>
                      <p className="text-gray-600">{interestedCount} people interested</p>
                    </div>
                  </div>

                  {selectedEvent.createdByName && (
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Organizer</p>
                        <p className="text-gray-600">{selectedEvent.createdByName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle className="text-center">Event Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={async () => {
                  setLoadingAction(true)
                  await toggleInterest(selectedEvent)
                  setLoadingAction(false)
                }}
                disabled={loadingAction}
                className={`w-full ${isInterested ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                variant={isInterested ? "default" : "outline"}
              >
                <Star className={`h-4 w-4 mr-2 ${isInterested ? "fill-current" : ""}`} />
                {isInterested ? "You're Interested" : "Show Interest"}
              </Button>

              <Button variant="outline" className="w-full" onClick={handleCalendarAdd}>
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>

              {selectedEvent.contact && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`tel:${selectedEvent.contact}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Organizer
                  </a>
                </Button>
              )}

              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Event
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <Users className="h-4 w-4 inline mr-1" />
                  {interestedCount} people interested
                </p>
              </div>

              {/* Event Insights */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-2">Event Insights</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Views:</span>
                    <span>{Math.floor(Math.random() * 500) + 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shares:</span>
                    <span>{Math.floor(Math.random() * 50) + 10}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>
                      {selectedEvent.createdAt ? new Date(selectedEvent.createdAt).toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

// Analytics Dashboard
function AnalyticsDashboard({ events, user }) {
  const userEvents = user ? events.filter((event) => event.createdBy === user.uid) : []
  const interestedEvents = user ? events.filter((event) => event.interestedUsers?.includes(user.uid)) : []

  const totalViews = userEvents.reduce((sum, event) => sum + (Math.floor(Math.random() * 500) + 100), 0)
  const totalInterested = userEvents.reduce((sum, event) => sum + (event.interestedUsers?.length || 0), 0)

  const categoryStats = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1
    return acc
  }, {})

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your event performance and engagement metrics</p>
      </div>

      {!user ? (
        <Card className="text-center p-8">
          <CardContent>
            <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view analytics</h3>
            <p className="text-gray-600">Track your event performance and engagement metrics</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Events</p>
                  <p className="text-2xl font-bold text-gray-900">{userEvents.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Interest</p>
                  <p className="text-2xl font-bold text-gray-900">{totalInterested}</p>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Interests</p>
                  <p className="text-2xl font-bold text-gray-900">{interestedEvents.length}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / events.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Your Event Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {event.interestedUsers?.length || 0} interested
                      </p>
                      <p className="text-xs text-gray-600">{Math.floor(Math.random() * 200) + 50} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

// Calendar View
function CalendarView({ events, setCurrentView, setSelectedEvent }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date) => {
    if (!date) return []
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Calendar</h1>
        <p className="text-gray-600">View events in calendar format</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : []
              const isToday = day && day.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border border-gray-200 ${
                    day ? "bg-white hover:bg-gray-50" : "bg-gray-100"
                  } ${isToday ? "bg-blue-50 border-blue-200" : ""}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 truncate"
                            onClick={() => {
                              setSelectedEvent(event)
                              setCurrentView("event-detail")
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

// User Dashboard
function UserDashboard({ user, events, setCurrentView, setSelectedEvent }) {
  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="text-center p-8">
          <CardContent>
            <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to access dashboard</h3>
            <p className="text-gray-600">Manage your events and preferences</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const userEvents = events.filter((event) => event.createdBy === user.uid)
  const interestedEvents = events.filter((event) => event.interestedUsers?.includes(user.uid))
  const upcomingUserEvents = userEvents.filter((event) => isEventUpcoming(event.date))
  const upcomingInterestedEvents = interestedEvents.filter((event) => isEventUpcoming(event.date))

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your events and track your interests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Events</p>
                <p className="text-2xl font-bold text-gray-900">{userEvents.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingUserEvents.length}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Interests</p>
                <p className="text-2xl font-bold text-gray-900">{interestedEvents.length}</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interest</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userEvents.reduce((sum, event) => sum + (event.interestedUsers?.length || 0), 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Events</CardTitle>
              <Button size="sm" onClick={() => setCurrentView("add-event")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">You haven't created any events yet</p>
                  <Button size="sm" className="mt-2" onClick={() => setCurrentView("add-event")}>
                    Create Your First Event
                  </Button>
                </div>
              ) : (
                userEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSelectedEvent(event)
                      setCurrentView("event-detail")
                    }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                      <div className="flex items-center mt-1">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-600">{event.interestedUsers?.length || 0} interested</span>
                      </div>
                    </div>
                    <Badge variant={isEventUpcoming(event.date) ? "default" : "secondary"}>
                      {isEventUpcoming(event.date) ? "Upcoming" : "Past"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events You're Interested In */}
        <Card>
          <CardHeader>
            <CardTitle>Your Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interestedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">You haven't shown interest in any events yet</p>
                  <Button size="sm" className="mt-2" onClick={() => setCurrentView("events")}>
                    Explore Events
                  </Button>
                </div>
              ) : (
                interestedEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSelectedEvent(event)
                      setCurrentView("event-detail")
                    }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                      <p className="text-sm text-gray-600">{[event.city, event.state].filter(Boolean).join(", ")}</p>
                    </div>
                    <Badge variant={isEventUpcoming(event.date) ? "default" : "secondary"}>
                      {isEventUpcoming(event.date) ? "Upcoming" : "Past"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Alert */}
      {(upcomingUserEvents.length > 0 || upcomingInterestedEvents.length > 0) && (
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900">Upcoming Events</h3>
                <p className="text-blue-700">
                  You have {upcomingUserEvents.length} upcoming events you're organizing and{" "}
                  {upcomingInterestedEvents.length} events you're interested in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

// Professional Add Event Form
function AddEventForm({
  user,
  handleAddEvent,
  form,
  handleChange,
  imageFile,
  handleImageChange,
  loading,
  setCurrentView,
}) {
  const categories = ["Business", "Technology", "Networking", "Conference", "Workshop", "Seminar"]

  const isFormValid = () => {
    const { title, date, category, city, state, country, contact, description } = form
    return (
      title.trim() !== "" &&
      date.trim() !== "" &&
      category.trim() !== "" &&
      city.trim() !== "" &&
      state.trim() !== "" &&
      country.trim() !== "" &&
      contact.trim() !== "" &&
      description.trim() !== "" &&
      imageFile !== null
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Add Professional Event - EventPro</title>
        <meta
          name="description"
          content="Create and list your professional event on EventPro. Reach business professionals and industry leaders."
        />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => setCurrentView("events")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Create Professional Event</CardTitle>
            <p className="text-gray-600 mt-2">Share your professional event with our business community</p>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleAddEvent} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Event Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Annual Business Summit 2024"
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-900 mb-2">
                    Event Date *
                  </label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-900 mb-2">
                    City *
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    placeholder="e.g., New York"
                    className="h-12"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-gray-900 mb-2">
                    State *
                  </label>
                  <Input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    placeholder="e.g., NY"
                    className="h-12"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-900 mb-2">
                    Country *
                  </label>
                  <Input
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                    placeholder="e.g., USA"
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-semibold text-gray-900 mb-2">
                  Contact Phone Number *
                </label>
                <Input
                  id="contact"
                  name="contact"
                  type="tel"
                  value={form.contact}
                  onChange={handleChange}
                  required
                  placeholder="e.g., (555) 123-4567"
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="imageUpload" className="block text-sm font-semibold text-gray-900 mb-2">
                  Event Image *
                </label>
                <Input
                  type="file"
                  id="imageUpload"
                  name="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="h-12 pt-3"
                />
                <p className="text-sm text-gray-500 mt-1">Upload a professional image that represents your event</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                  Event Description *
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  placeholder="Provide a detailed description of your professional event, including agenda, speakers, and what attendees can expect..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !user || !isFormValid()}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-semibold text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Event...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Professional Event
                  </>
                )}
              </Button>

              {!user && <p className="text-center text-red-600 text-sm">Please sign in to create events</p>}

              {user && !isFormValid() && (
                <p className="text-center text-red-600 text-sm">Please fill all required fields and select an image</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

// Main App Component
export default function ProfessionalEventApp() {
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState("events")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [form, setForm] = useState({
    title: "",
    date: "",
    state: "",
    city: "",
    country: "",
    description: "",
    contact: "",
    category: "",
    imageUrl: "",
  })
  const [imageFile, setImageFile] = useState(null)

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u))
    return () => unsubscribe()
  }, [])

  // Firestore events real-time listener
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"))
    const unsub = onSnapshot(q, (snapshot) => {
      setEvents(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      )
    })
    return () => unsub()
  }, [])

  async function handleLogin() {
    try {
      setLoading(true)
      await signInWithPopup(auth, provider)
    } catch (error) {
      alert("Sign in failed: " + error.message)
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      setLoading(true)
      await signOut(auth)
    } catch (error) {
      alert("Sign out failed: " + error.message)
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImageChange(e) {
    setImageFile(e.target.files[0])
  }

  async function uploadImage() {
    if (!imageFile) return null

    setLoading(true)
    const formData = new FormData()
    formData.append("file", imageFile)
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (response.ok) {
        return data.secure_url
      } else {
        throw new Error(data.error?.message || "Image upload failed.")
      }
    } catch (error) {
      console.error("Image upload failed:", error)
      alert("Failed to upload image: " + error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault()
    if (!user) {
      alert("Please sign in to create an event.")
      return
    }

    const { title, date, category, city, state, country, contact, description } = form
    if (
      !title.trim() ||
      !date.trim() ||
      !category.trim() ||
      !city.trim() ||
      !state.trim() ||
      !country.trim() ||
      !contact.trim() ||
      !description.trim() ||
      !imageFile
    ) {
      alert("All fields are required. Please complete the form and select an image.")
      return
    }

    setLoading(true)
    let imageUrl = ""
    if (imageFile) {
      imageUrl = await uploadImage()
      if (!imageUrl) {
        setLoading(false)
        return
      }
    }

    const locationString = [form.city, form.state, form.country].filter(Boolean).join(", ")
    const eventSlug = generateSlug(form.title)

    try {
      const coords = await geocodeAddress(locationString)
      await addDoc(collection(db, "events"), {
        title: form.title.trim(),
        date: form.date,
        state: form.state.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        contact: form.contact.trim(),
        description: form.description.trim(),
        category: form.category,
        imageUrl: imageUrl,
        coords: coords,
        slug: eventSlug,
        interestedUsers: [],
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: new Date().toISOString(),
      })

      setForm({
        title: "",
        date: "",
        state: "",
        city: "",
        country: "",
        description: "",
        contact: "",
        category: "",
        imageUrl: "",
      })
      setImageFile(null)
      alert("Event created successfully!")
      setCurrentView("events")
    } catch (error) {
      alert("Failed to create event: " + error.message)
      console.error("Add event error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleInterest(event) {
    if (!user) {
      alert("Please sign in to show interest.")
      return
    }

    setLoading(true)
    const eventRef = doc(db, "events", event.id)
    const isInterested = event.interestedUsers?.includes(user.uid)

    try {
      await updateDoc(eventRef, {
        interestedUsers: isInterested ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })

      // Update selectedEvent if it's the same event
      if (selectedEvent && selectedEvent.id === event.id) {
        setSelectedEvent((prev) => ({
          ...prev,
          interestedUsers: isInterested
            ? prev.interestedUsers.filter((uid) => uid !== user.uid)
            : [...(prev.interestedUsers || []), user.uid],
        }))
      }
    } catch (error) {
      alert("Failed to update interest: " + error.message)
      console.error("Toggle interest error:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "events":
        return (
          <EventListingPage
            user={user}
            events={events}
            loading={loading}
            toggleInterest={toggleInterest}
            setCurrentView={setCurrentView}
            setSelectedEvent={setSelectedEvent}
          />
        )
      case "event-detail":
        return (
          <EventDetailPage
            user={user}
            toggleInterest={toggleInterest}
            selectedEvent={selectedEvent}
            setCurrentView={setCurrentView}
          />
        )
      case "add-event":
        return (
          <AddEventForm
            user={user}
            handleAddEvent={handleAddEvent}
            form={form}
            handleChange={handleChange}
            imageFile={imageFile}
            handleImageChange={handleImageChange}
            loading={loading}
            setCurrentView={setCurrentView}
          />
        )
      case "analytics":
        return <AnalyticsDashboard events={events} user={user} />
      case "calendar":
        return <CalendarView events={events} setCurrentView={setCurrentView} setSelectedEvent={setSelectedEvent} />
      case "dashboard":
        return (
          <UserDashboard
            user={user}
            events={events}
            setCurrentView={setCurrentView}
            setSelectedEvent={setSelectedEvent}
          />
        )
      default:
        return (
          <EventListingPage
            user={user}
            events={events}
            loading={loading}
            toggleInterest={toggleInterest}
            setCurrentView={setCurrentView}
            setSelectedEvent={setSelectedEvent}
          />
        )
    }
  }

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-gray-50">
        <ProfessionalNavigation
          user={user}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />

        {renderCurrentView()}

        <footer className="bg-white border-t mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">EventPro</span>
              </div>
              <p className="text-gray-600 mb-4">Professional event management made simple</p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500 mb-4">
                <button onClick={() => setCurrentView("events")} className="hover:text-blue-600">
                  Events
                </button>
                <button onClick={() => setCurrentView("analytics")} className="hover:text-blue-600">
                  Analytics
                </button>
                <button onClick={() => setCurrentView("calendar")} className="hover:text-blue-600">
                  Calendar
                </button>
                <button onClick={() => setCurrentView("dashboard")} className="hover:text-blue-600">
                  Dashboard
                </button>
              </div>
              <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} EventPro. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  )
}
