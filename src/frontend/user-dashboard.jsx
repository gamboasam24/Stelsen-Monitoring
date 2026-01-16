import React, { useState, useEffect, useRef } from "react";
import {
  IoMdHome,
  IoMdClose,
  IoMdNotifications,
  IoMdMegaphone,
  IoMdCheckmarkCircle,
  IoMdTime,
  IoMdSend
} from "react-icons/io";
import {
  MdDashboard,
  MdLocationOn,
  MdReportProblem,
  MdMenu,
  MdAdd,
  MdEvent,
  MdAnnouncement,
  MdPushPin,
  MdChat,
  MdCheckCircle,
  MdPerson,
  MdWork,
  MdChatBubble,
  MdCalendarToday,
  MdComment,
  MdPeople,
  MdNotifications,
  MdMyLocation,
  MdCamera,
  MdCheck
} from "react-icons/md";
import {
  FaUser,
  FaSignOutAlt,
  FaRegCalendarAlt,
  FaRegNewspaper,
  FaRegBell,
  FaMapMarkerAlt
} from "react-icons/fa";
import {
  FiSettings,
  FiChevronRight,
  FiPlus,
  FiChevronLeft,
  FiCamera,
  FiPaperclip,
  FiBell,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiX
} from "react-icons/fi";
import {
  HiOutlineChatAlt2,
  HiOutlineClipboardList
} from "react-icons/hi";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const UserDashboard = ({ user, logout }) => {
  const [activeTab, setActiveTab] = useState("Home");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Fetching location...");
  const [reportMessage, setReportMessage] = useState("");
  const [userStatus, setUserStatus] = useState("Active");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAnnouncementFilterMenu, setShowAnnouncementFilterMenu] = useState(false);
  // Navigation stack for screen-based navigation (replaces modals)
  const [navigationStack, setNavigationStack] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("new");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [showDateFilterMenu, setShowDateFilterMenu] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const actionMenuRef = useRef(null);

  // Prevent body scroll when date picker modal is open
  useEffect(() => {
    if (showDatePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDatePicker]);

  const fileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [readComments, setReadComments] = useState(() => {
    try {
      const saved = localStorage.getItem('userDashboardReadComments');
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error('Error loading read comments:', err);
      return {};
    }
  });
  const [otherUsersLocations, setOtherUsersLocations] = useState([]);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // Pin state is provided by backend (persisted like admin)

  // Save read comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userDashboardReadComments', JSON.stringify(readComments));
    } catch (err) {
      console.error('Error saving read comments:', err);
    }
  }, [readComments]);

  // Fetch other users' locations when in My Location tab
  useEffect(() => {
    if (activeTab === 'My Location') {
      fetchOtherUsersLocations();
      // Auto-center map on user's current location
      setViewState({
        longitude: userCoordinates.longitude,
        latitude: userCoordinates.latitude,
        zoom: 15
      });
      // Disabled interval for now - only fetch once when tab changes
      // const interval = setInterval(fetchOtherUsersLocations, 5000);
      // return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchOtherUsersLocations = async () => {
    try {
      const response = await fetch('/backend/location.php?user_id=all', {
        credentials: 'include'
      });
      const text = await response.text();
      console.log('Response from location.php:', text.substring(0, 100));
      
      const data = JSON.parse(text);
      if (data.status === 'success' && data.locations) {
        // Filter out current user's location
        const others = data.locations.filter(loc => loc.user_id !== user?.id);
        setOtherUsersLocations(others);
      }
    } catch (err) {
      console.error('Error fetching other users locations:', err);
    }
  };

  const [viewState, setViewState] = useState({
    longitude: 120.9842,
    latitude: 14.5995,
    zoom: 15
  });

  // Actual user GPS coordinates (separate from map view state)
  const [userCoordinates, setUserCoordinates] = useState({
    longitude: 120.9842,
    latitude: 14.5995
  });

  // Enhanced announcements data
  const [announcements, setAnnouncements] = useState([

  ]);

  // Filtered announcements
  const filteredAnnouncements = announcements.filter(ann => {
    // Filter by status (unread, important, etc.)
    if (selectedFilter === "unread") return ann.unread;
    if (selectedFilter === "important") return ann.important;
    if (selectedFilter === "pinned") return ann.is_pinned;
    if (selectedFilter === "read") return !ann.unread;
    if (selectedFilter === "new") return ann.isNew;
    return true;
  }).filter(ann => {
    // Filter by date
    if (dateFilter === "all") return true;
    
    const announcementDate = new Date(ann.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === "today") {
      const annDate = new Date(ann.created_at);
      annDate.setHours(0, 0, 0, 0);
      return annDate.getTime() === today.getTime();
    }
    
    if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return announcementDate >= weekAgo;
    }
    
    if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return announcementDate >= monthAgo;
    }
    
    if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return announcementDate >= startDate && announcementDate <= endDate;
    }
    
    return true;
  }).filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return Number(b.is_pinned) - Number(a.is_pinned);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Mark all announcements as read (local state only)
  const markAllAsRead = async () => {
    const unreadAnnouncements = announcements.filter(ann => ann.unread);
    for (const ann of unreadAnnouncements) {
      await markAsRead(ann.id);
    }
  };

  const formatTimeAgo = (dateString) => {
  const created = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - created) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
    return created.toLocaleDateString();
  };

  const getCommentTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    return formatTimeAgo(timestamp);
  };

  const formatAuthorName = (email) => {
    if (!email) return "Unknown";

    return email
      .split("@")[0]            // remove domain
      .replace(/\d+/g, "")      // remove numbers
      .replace(/\b\w/g, c => c.toUpperCase()); // capitalize
  };

  // Format numbers as Philippine Peso with comma grouping
  const formatPeso = (value) => {
    if (value === null || value === undefined || value === "") return "₱0";
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return "₱0";
    return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Treat tasks as new for 3 days from start date; if no date, assume new when progress is 0
  const isProjectNew = (dateValue, progress) => {
    if (dateValue) {
      const start = new Date(dateValue);
      if (!isNaN(start)) {
        const diffDays = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) return true;
      }
    }
    return progress === undefined || progress === null || Number(progress) === 0;
  };

  useEffect(() => {
  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    try {
      const res = await fetch("/backend/announcements.php", {
        credentials: "include",
      });
      const data = await res.json();
      const normalized = data.map(a => {
        const createdDate = new Date(a.created_at);
        const now = new Date();
        const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
        return {
          id: a.announcement_id,
          title: a.title,
          content: a.content,
          type: a.type,
          priority: a.priority,
          author: formatAuthorName(a.author),
          time: formatTimeAgo(a.created_at),
          category: a.type.charAt(0).toUpperCase() + a.type.slice(1),
          important: a.priority === "high",
          color: getColorForType(a.type),
          unread: a.unread === 1,
          icon: getIconForType(a.type),
          is_pinned: a.is_pinned === 1,
          isNew: daysDiff <= 3,
          created_at: a.created_at,
        };
      });

      setAnnouncements(normalized);
      setIsLoadingAnnouncements(false);
    } catch (err) {
      console.error("Announcement fetch error:", err);
      setIsLoadingAnnouncements(false);
    }
  };

  fetchAnnouncements();
}, []);

// Fetch users for names/avatars
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await fetch("/backend/users.php", { credentials: "include" });
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map(u => ({
            ...u,
            profile_image: u.profile_image || null,
          }))
        : [];
      setUsers(normalized);
    } catch (err) {
      console.error("Users fetch error:", err);
      setUsers([]);
    }
  };

  fetchUsers();
}, []);

// Initial loading management - hide loading screen after data is fetched
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 1500); // Minimum loading time for smooth UX
  return () => clearTimeout(timer);
}, []);

// Fetch projects assigned to current user
useEffect(() => {
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch("/backend/projects.php", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      
      // Filter projects where current user is assigned
      // Handle both string and number IDs for comparison
      const userProjects = data.filter(project => {
        if (!project.assignedUsers || !Array.isArray(project.assignedUsers)) {
          return false;
        }
        // Check if user ID exists in assignedUsers (handle both string and number)
        return project.assignedUsers.some(assignedId => 
          String(assignedId) === String(user?.id) || 
          Number(assignedId) === Number(user?.id)
        );
      });
      
      // Fetch comment counts for each project
      const projectsWithComments = await Promise.all(
        userProjects.map(async (project) => {
          try {
            const commentsRes = await fetch(`/backend/comments.php?project_id=${project.id}`, { 
              credentials: "include" 
            });
            const commentsData = await commentsRes.json();
            const comments = commentsData.status === "success" 
              ? (commentsData.comments || []).map(c => ({
                  id: c.comment_id,
                  text: c.comment,
                  time: getCommentTimeAgo(c.created_at),
                  created_at: c.created_at,
                  email: c.email,
                  profile_image: c.profile_image,
                  user: c.user || formatAuthorName(c.email),
                }))
              : [];
            const isNew = isProjectNew(project.startDate || project.start_date || project.created_at, project.progress);
            return { ...project, comments, isNew };
          } catch (err) {
            console.error(`Failed to fetch comments for project ${project.id}:`, err);
            const isNew = isProjectNew(project.startDate || project.start_date || project.created_at, project.progress);
            return { ...project, comments: [], isNew };
          }
        })
      );
      
      setProjects(projectsWithComments);
      setIsLoadingProjects(false);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setIsLoadingProjects(false);
    }
  };

  if (user?.id) {
    fetchProjects();
  }
}, [user]);

   // Get icon for announcement type
    const getIconForType = (type) => {
      switch (type) {
        case "meeting": return <MdCalendarToday className="text-white" size={18} />;
        case "deadline": return <IoMdTime className="text-white" size={18} />;
        case "safety": return <HiOutlineClipboardList className="text-white" size={18} />;
        case "update": return <MdAnnouncement className="text-white" size={18} />;
        case "question": return <MdChat className="text-white" size={18} />;
        default: return <MdChatBubble className="text-white" size={18} />;
      }
    };

  // Get color for announcement type
  const getColorForType = (type) => {
    switch (type) {
      case "meeting": return "red";
      case "deadline": return "red";
      case "safety": return "green";
      case "update": return "purple";
      case "question": return "yellow";
      default: return "blue";
    }   
  };

const getPriorityBadge = (priority) => {
  if (priority === "high") {
    return <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">High Priority</span>;
  }
  if (priority === "medium") {
    return <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs rounded-full">Medium Priority</span>;
  }
  return null;
};


  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };

    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showActionMenu]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reverse geocode to get location name from coordinates
  const getLocationName = async (longitude, latitude) => {
    try {
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&types=address,poi,place,locality,neighborhood`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const text = feature.text;
        
        // Get context for better name construction
        const context = feature.context || [];
        const addressNum = feature.address ? `${feature.address} ` : '';
        const streetName = text;
        const neighborhood = context.find(c => c.id.startsWith('neighborhood'))?.text;
        const locality = context.find(c => c.id.startsWith('locality'))?.text;
        const place = context.find(c => c.id.startsWith('place'))?.text;
        const region = context.find(c => c.id.startsWith('region'))?.text;
        
        // Build hierarchical address from most specific to general
        // Priority: Street Address > Neighborhood > Locality > Place > Region
        if (feature.place_type.includes('address')) {
          // Full street address
          if (addressNum && streetName && place && region) {
            return `${addressNum}${streetName}, ${place}, ${region}`;
          } else if (streetName && place && region) {
            return `${streetName}, ${place}, ${region}`;
          } else if (streetName && place) {
            return `${streetName}, ${place}`;
          }
        }
        
        if (feature.place_type.includes('poi')) {
          return text; // Return POI name (e.g., "SM Mall", "Coffee Shop")
        }
        
        // Build from neighborhood/locality
        if (neighborhood && place && region) {
          return `${neighborhood}, ${place}, ${region}`;
        } else if (locality && place && region) {
          return `${locality}, ${place}, ${region}`;
        } else if (neighborhood && place) {
          return `${neighborhood}, ${place}`;
        } else if (place && region) {
          return `${place}, ${region}`;
        } else if (place) {
          return place;
        }
        
        // Fallback to full place_name for detailed location
        return feature.place_name;
      }
      return 'Unknown Location';
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unknown Location';
    }
  };

  // Save location to backend
  const saveLocationToBackend = async (longitude, latitude, locationName = null) => {
    try {
      const response = await fetch('/backend/location.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          longitude,
          latitude,
          location_name: locationName
        })
      });
      const data = await response.json();
      console.log('Location saved:', data);

      // Add to location history with actual timestamp
      if (locationName) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        setLocationHistory(prev => [{ 
          id: Date.now().toString(), 
          location: locationName, 
          time, 
          date,
          longitude,
          latitude,
          timestamp: now.toISOString()
        }, ...prev.slice(0, 19)]);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  // Manual refresh location function
  const refreshLocation = async () => {
    setIsRefreshingLocation(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const longitude = pos.coords.longitude;
          const latitude = pos.coords.latitude;
          
          // Update actual user coordinates for marker
          setUserCoordinates({
            longitude,
            latitude
          });
          
          // Center map on new location
          setViewState({
            longitude,
            latitude,
            zoom: 15
          });
          
          // Get updated location name
          const locationName = await getLocationName(longitude, latitude);
          setCurrentLocation(locationName);
          
          // Save updated location to backend
          await saveLocationToBackend(longitude, latitude, locationName);
          
          setIsRefreshingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please check your location permissions.");
          setIsRefreshingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Don't use cached position
        }
      );
    } catch (error) {
      console.error('Error refreshing location:', error);
      setIsRefreshingLocation(false);
    }
  };

  useEffect(() => {
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const longitude = pos.coords.longitude;
        const latitude = pos.coords.latitude;
        
        // Update actual user coordinates for marker
        setUserCoordinates({
          longitude,
          latitude
        });
        
        // Update map view to show user location
        setViewState({
          longitude,
          latitude,
          zoom: 15
        });
        
        // Get actual location name from coordinates
        const locationName = await getLocationName(longitude, latitude);
        setCurrentLocation(locationName);
        
        // Save initial location to backend with actual name
        saveLocationToBackend(longitude, latitude, locationName);
      },
      () => {
        alert("Location access denied");
        setCurrentLocation("Location access denied");
      }
    );

    // Watch for continuous location updates
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const longitude = pos.coords.longitude;
        const latitude = pos.coords.latitude;
        
        // Update actual user coordinates for marker
        setUserCoordinates({
          longitude,
          latitude
        });
        
        // Get updated location name
        const locationName = await getLocationName(longitude, latitude);
        setCurrentLocation(locationName);
        
        // Save updated location to backend
        saveLocationToBackend(longitude, latitude, locationName);
      },
      () => {
        console.error("Error tracking location");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // 10 seconds
        timeout: 5000 // 5 seconds
      }
    );

    // Cleanup watch on unmount
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Mark a specific announcement as read
  // This function sends a request to the backend and updates the local state
  const markAsRead = async (id) => {
    // Send request to backend to mark as read
    await fetch("/backend/mark_read.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement_id: id }),
    });

    // Update local state to reflect the change immediately
    setAnnouncements(prev => 
      prev.map(ann => 
        ann.id === id ? { ...ann, unread: false } : ann
      )
    );
  };

  const togglePin = async (id, nextPinned) => {
    try {
      const res = await fetch("/backend/announcements.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", id, pinned: nextPinned })
      });
      const data = await res.json();
      if (data.status !== "success") {
        console.error("Pin update failed:", data.message);
      }
      setAnnouncements(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, is_pinned: nextPinned } : a);
        return [...updated].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
      });
    } catch (err) {
      console.error("Toggle pin error:", err);
    }
  };


  const [projects, setProjects] = useState([]);

  const [locationHistory, setLocationHistory] = useState([]);

  // Progress Update States
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressStatus, setProgressStatus] = useState("In Progress");
  const [progressNotes, setProgressNotes] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [taskLocation, setTaskLocation] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationValidationMsg, setLocationValidationMsg] = useState("");

  // Refs for camera
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);

  const updateLocation = (location) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString();

    setCurrentLocation(location);
    setLocationHistory(prev => [{ id: Date.now().toString(), location, time, date }, ...prev.slice(0, 9)]);
    setShowLocationModal(false);
    alert(`Location Updated: Your location has been set to ${location}`);
  };

  const submitReport = () => {
    if (!reportMessage.trim()) return alert("Please enter a report message");
    alert("Report Submitted: Your report has been sent to admin");
    setReportMessage("");
    setShowReportModal(false);
    setShowActionMenu(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "ongoing": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "scheduled": return "bg-yellow-500";
      case "pending": return "bg-violet-500";
      default: return "bg-gray-500";
    }
  };

  const getAnnouncementColor = (type) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-600";
      case "deadline": return "bg-red-100 text-red-600";
      case "general": return "bg-greengeneral-100 text-green-600";
      case "maintenance": return "bg-yellow-100 text-yellow-600";
      case "update": return "bg-purple-100 text-purple-600";
      default: return <MdChatBubble className="text-white" size={18} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "high": return "High Priority";
      case "medium": return "Medium Priority";
      case "low": return "Low Priority";
      default: return "Normal";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (color) => {
    switch (color) {
      case "blue": return "bg-gradient-to-br from-blue-500 to-blue-600";
      case "red": return "bg-gradient-to-br from-red-500 to-red-600";
      case "green": return "bg-gradient-to-br from-green-500 to-green-600";
      case "purple": return "bg-gradient-to-br from-purple-500 to-purple-600";
      case "yellow": return "bg-gradient-to-br from-yellow-500 to-yellow-600";
      default: return "bg-gradient-to-br from-gray-500 to-gray-600";
    }
  };

  const handleProfileClick = () => {
    if (isMobile) {
      setProfileOpen(true);
    } else {
      setActiveTab("Profile");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (profileOpen) setProfileOpen(false);
    if (showActionMenu) setShowActionMenu(false);
  };

  // Navigation Stack Functions
  const pushScreen = (screenName, data = {}) => {
    setNavigationStack(prev => [...prev, { screen: screenName, data }]);
  };

  const popScreen = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const getCurrentScreen = () => {
    return navigationStack[navigationStack.length - 1];
  };

  const viewProjectDetails = async (project) => {
    // Prime selected project immediately
    setSelectedProject({ ...project, comments: project.comments || [] });
    pushScreen("projectDetails", { project });

    // Fetch fresh comments for this project
    try {
      const res = await fetch(`/backend/comments.php?project_id=${project.id}`, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        const mapped = (data.comments || []).map((c) => ({
          id: c.comment_id,
          text: c.comment,
          time: getCommentTimeAgo(c.created_at),
          created_at: c.created_at,
          email: c.email,
          profile_image: c.profile_image,
          user: c.user || formatAuthorName(c.email),
          attachments: c.attachments || null,
        }));

        setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, comments: mapped } : p));
      }
    } catch (err) {
      console.error("Project comments fetch error:", err);
    }
  };

  const addComment = async (projectId) => {
    if (!commentText.trim() && commentAttachments.length === 0) return;
    if (isSending) return; // Prevent double submission

    // Store values before clearing
    const messageText = commentText.trim();
    const attachments = [...commentAttachments];

    // Optimistic update: Create temporary comment immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      user: formatAuthorName(user?.email),
      text: messageText,
      time: "Sending...",
      created_at: new Date().toISOString(),
      profile_image: getCurrentUserProfileImage(),
      email: user?.email,
      attachments: attachments.length > 0 ? attachments.map(a => ({
        name: a.name,
        type: a.type,
        size: a.size,
        path: a.preview || null
      })) : null,
      _sending: true, // Flag to show sending state
    };

    // Clear input immediately for instant feedback
    setCommentText("");
    setCommentAttachments([]);
    setIsSending(true);

    // Add optimistic comment to UI
    setSelectedProject(prev => prev && prev.id === projectId
      ? { ...prev, comments: [...(prev.comments || []), optimisticComment] }
      : prev
    );
    setProjects(prev => prev.map(p => p.id === projectId 
      ? { ...p, comments: [...(p.comments || []), optimisticComment] } 
      : p
    ));

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("text", messageText);
      
      // Append actual file objects for multipart upload
      attachments.forEach((attachment) => {
        formData.append("attachments[]", attachment.rawFile);
      });

      const response = await fetch("/backend/comments.php", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (data.status === "success") {
        // Replace optimistic comment with real one
        const realComment = {
          id: data.comment_id || Date.now(),
          user: data.user || formatAuthorName(user?.email),
          text: messageText,
          time: "Just now",
          created_at: new Date().toISOString(),
          profile_image: data.profile_image || getCurrentUserProfileImage(),
          email: data.email || user?.email,
          attachments: data.attachments || null,
        };

        // Replace temp comment with real one
        setSelectedProject(prev => prev && prev.id === projectId
          ? { ...prev, comments: prev.comments.map(c => c.id === tempId ? realComment : c) }
          : prev
        );
        setProjects(prev => prev.map(p => p.id === projectId 
          ? { ...p, comments: p.comments.map(c => c.id === tempId ? realComment : c) } 
          : p
        ));
      } else {
        throw new Error(data.message || "Failed to send");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      
      // Remove optimistic comment on error
      setSelectedProject(prev => prev && prev.id === projectId
        ? { ...prev, comments: prev.comments.filter(c => c.id !== tempId) }
        : prev
      );
      setProjects(prev => prev.map(p => p.id === projectId 
        ? { ...p, comments: p.comments.filter(c => c.id !== tempId) } 
        : p
      ));

      // Restore the text and attachments so user can retry
      setCommentText(messageText);
      setCommentAttachments(attachments);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getUserById = (uid) => Array.isArray(users) ? users.find(u => String(u.id) === String(uid)) : undefined;

  const handleCommentFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          rawFile: file, // Store actual File object for FormData
        });
      }
      setCommentAttachments(prev => [...prev, ...newAttachments]);
    }
    // Reset input
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCameraModal(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });

          setCommentAttachments(prev => [...prev, {
            name: file.name,
            preview: URL.createObjectURL(blob),
            size: file.size,
            type: file.type,
            rawFile: file,
          }]);

          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Auto-refresh comments when modal is open
  useEffect(() => {
    if (!showCommentsModal || !selectedProject?.id) return;

    const refreshComments = async () => {
      try {
        const res = await fetch(`/backend/comments.php?project_id=${selectedProject.id}`, { credentials: "include" });
        const data = await res.json();
        if (data.status === "success") {
          const mapped = (data.comments || []).map((c) => ({
            id: c.comment_id,
            text: c.comment,
            time: getCommentTimeAgo(c.created_at),
            created_at: c.created_at,
            email: c.email,
            profile_image: c.profile_image,
            user: c.user || formatAuthorName(c.email),
            attachments: c.attachments || null,
          }));

          setSelectedProject(prev => prev ? { ...prev, comments: mapped } : prev);
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, comments: mapped } : p));
        }
      } catch (err) {
        console.error("Auto-refresh comments error:", err);
      }
    };

    // Refresh every 3 seconds
    const interval = setInterval(refreshComments, 3000);
    return () => clearInterval(interval);
  }, [showCommentsModal, selectedProject?.id]);

  const getProfileImageByEmail = (email) => {
    if (!email || !Array.isArray(users)) return null;
    const match = users.find(u => u.email === email);
    return match?.profile_image || null;
  };

  const getCurrentUserProfileImage = () => {
    if (!Array.isArray(users)) return user?.profile_image || null;
    const match = users.find(u => String(u.id) === String(user?.id) || u.email === user?.email);
    return match?.profile_image || user?.profile_image || null;
  };

  // Avatar component for consistent profile display
  const Avatar = ({ userObj, size = 32, className = "" }) => {
    const initial =
      userObj?.name?.charAt(0) ||
      userObj?.email?.charAt(0) ||
      "?";

    const [imgError, setImgError] = useState(false);

    // PRIORITY: uploaded → google → fallback
    const imageSrc =
      userObj?.uploaded_profile_image ||
      userObj?.profile_image ||
      null;

    if (!imageSrc || imgError) {
      return (
        <div
          className={`bg-blue-500 text-white font-bold flex items-center justify-center rounded-full ${className}`.trim()}
          style={{ width: size, height: size }}
        >
          {initial.toUpperCase()}
        </div>
      );
    }

    return (
      <img
        src={imageSrc}
        alt="Profile"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover ${className}`.trim()}
        style={{ width: size, height: size }}
      />
    );
  };

//========================================================== Render Functions ==========================================================
const renderAnnouncementCard = (announcement) => (
  <div
    key={announcement.id}
    className={`relative bg-white rounded-2xl p-4 mb-3 shadow-lg ${
      announcement.unread ? "border-l-4 border-blue-500" : ""
    }`}
    onClick={() => markAsRead(announcement.id)}
  >
      {announcement.isNew && (
        <span className="absolute -top-1 -right-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg z-10">
          New
        </span>
      )}
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-xl ${getCategoryColor(announcement.color)} flex items-center justify-center mr-3`}>
            {announcement.icon}
          </div>
          <div>
          <h4 className="font-bold text-gray-800">{announcement.title}</h4>
          <div className="flex items-center text-xs text-gray-500">
           <span className="text-xs text-gray-500">{announcement.category}</span>
            {getPriorityBadge(announcement.priority)}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => { e.stopPropagation(); togglePin(announcement.id, !announcement.is_pinned); }}
          className={`p-2 rounded-full hover:bg-gray-100 transition ${announcement.is_pinned ? "text-red-500" : "text-gray-500"}`}
          aria-label={announcement.is_pinned ? "Unpin announcement" : "Pin announcement"}
          title={announcement.is_pinned ? "Unpin" : "Pin"}
        >
          <MdPushPin size={18} />
        </button>
        {announcement.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
      </div>
    </div>

    {/* Content */}
    <p className="text-gray-600 text-sm mb-3">{announcement.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500 flex items-center">
            <IoMdTime className="mr-1" size={14} />
            {announcement.time}
          </span>
          <span className="text-xs text-gray-500">By: {announcement.author}</span>
        </div>
        <div className="flex items-center">
          {announcement.unread ? (
           <button
            onClick={async (e) => {
              e.stopPropagation(); // Prevent parent click event
              await markAsRead(announcement.id);
            }}
            className="text-xs text-blue-500 font-medium hover:text-blue-600"
          >
            Mark as read
          </button> 
          ) : (
            <div className="flex items-center text-gray-500 text-sm">
              <IoMdCheckmarkCircle size={16} className="mr-1" />
              <span>Read</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getUnreadCommentCount = (projectId) => {
    const projectReadComments = readComments[projectId] || [];
    const projectComments = projects.find(p => p.id === projectId)?.comments || [];
    return projectComments.filter(c => !projectReadComments.includes(c.id)).length;
  };

  const renderProjectCard = (item) => {
    const unreadCount = getUnreadCommentCount(item.id);
    return (
    <div key={item.id} className="relative bg-white rounded-2xl p-4 mb-3 shadow-lg hover:shadow-xl transition-all">
      {item.isNew && (
      <span className="absolute -top-1 -left-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg z-10">
        New
      </span>
      )}
      <div className="flex justify-between items-center mb-4">
      <div className="flex items-center flex-1">
        <div className="ml-3">
        <h4 className="font-bold text-gray-800">{item.title}</h4>
        <p className="text-xs text-gray-500">Managed by {item.manager}</p>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full ${getStatusColor(item.status)} text-white text-xs`}>
        {item.status}
      </div>
      </div>
      
      <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span className="text-xs cursor-pointer hover:text-blue-600 transition-colors" onClick={() => {
          setSelectedTaskForProgress(item);
          setProgressPercentage(item.progress || 0);
          setShowProgressModal(true);
        }}>
          📊 Update Progress
        </span>
        <span className="font-bold">{item.progress}%</span>
      </div>
      <div 
        className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => {
          setSelectedTaskForProgress(item);
          setProgressPercentage(item.progress || 0);
          setShowProgressModal(true);
        }}
      >
        <div
        className={`h-full rounded-full ${getStatusColor(item.status)}`}
        style={{ width: `${item.progress}%` }}
        ></div>
      </div>
      </div>
      
      <div className="flex items-center justify-between">
      <div className="text-xs text-gray-500">
        <div>Deadline: <span className="font-medium">{item.deadline}</span></div>
        <div>Budget: <span className="font-medium">{formatPeso(item.budget)}</span></div>
      </div>
      <div className="flex items-center space-x-2">
        <button
        onClick={() => {
          setSelectedProject({ ...item, comments: item.comments || [] });
          setShowCommentsModal(true);
          // Mark all comments as read for this project
          if (item && item.comments) {
          const commentIds = item.comments.map(c => c.id);
          setReadComments(prev => ({
            ...prev,
            [item.id]: commentIds
          }));
          }
        }}
        className="flex items-center text-xs text-gray-500 relative hover:text-blue-500 transition-colors"
        >
        <MdComment size={14} className="mr-1" />
        {(item.comments && item.comments.length) || 0}
        {unreadCount > 0 && (
          <div className="absolute -top-0.5 -right-0.1 w-2 h-2 bg-red-500 rounded-full "></div>
        )}
        </button>
        <button 
        onClick={() => viewProjectDetails(item)}
        className="text-blue-500 text-sm font-medium flex items-center"
        >
        Details <FiChevronRight size={16} className="ml-1" />
        </button>
      </div>
      </div>
    </div>
    );
  };

  const renderProjectDetailsModal = () => (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-in-right">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 bg-white px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <button 
          onClick={popScreen}
          className="p-2 rounded-full hover:bg-gray-100 mr-3"
        >
          <FiChevronLeft size={24} className="text-gray-700" />
        </button>
        <h3 className="flex-1 text-lg font-bold text-gray-800">Tasks Details</h3>
        {selectedProject && (
          <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedProject.status)} text-white text-xs inline-block flex-shrink-0`}>
            {selectedProject.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">

        
        {selectedProject && (
          <>
            <div className="flex flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-800 flex-1">{selectedProject.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="space-y-3 sm:space-y-5">
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Team Users</p>
                  <div className="flex flex-wrap gap-1 sm:gap-2 items-start content-start">
                    {selectedProject.assignedUsers && selectedProject.assignedUsers.length > 0 ? (
                      selectedProject.assignedUsers.map((uid, idx) => {
                        const isCurrentUser = String(uid) === String(user?.id);
                        const foundUser = getUserById(uid);
                        const label = isCurrentUser
                          ? `${formatAuthorName(user?.email)}`
                          : formatAuthorName(foundUser?.email) || `User #${uid}`;
                        const avatar = foundUser?.profile_image;

                        return (
                          <span
                            key={`${uid}-${idx}`}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                              isCurrentUser
                                ? "bg-blue-600 text-white border-blue-700"
                                : "bg-blue-50 text-blue-800 border-blue-100"
                            }`}
                          >
                            {avatar ? (
                              <img src={avatar} alt={label} className="w-6 h-6 rounded-full" />
                            ) : (
                              <FaUser size={14} />
                            )}
                            <span className="whitespace-nowrap">{label}</span>
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 w-full">None</p>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
                  <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">{selectedProject.description}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-5">
                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Manager</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.manager || 'N/A'}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Budget</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{selectedProject.budget ? formatPeso(selectedProject.budget) : 'N/A'}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Deadline</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.deadline || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="sm:hidden mb-6">
              <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</p>
              <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">{selectedProject.description}</p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowCommentsModal(true);
                  // Mark all comments as read for this project
                  if (selectedProject && selectedProject.comments) {
                    const commentIds = selectedProject.comments.map(c => c.id);
                    setReadComments(prev => ({
                      ...prev,
                      [selectedProject.id]: commentIds
                    }));
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-4 transition-all border border-blue-200 flex items-center justify-between relative"
              >
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-full mr-3 relative">
                    <MdComment className="text-white" size={24} />
                    {getUnreadCommentCount(selectedProject?.id) > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center ">
                        {getUnreadCommentCount(selectedProject?.id)}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="text-md font-bold text-gray-800">Comments & Clarifications</h4>
                    <p className="text-sm text-gray-600">
                      {selectedProject.comments && selectedProject.comments.length > 0
                        ? `${selectedProject.comments.length} comment${selectedProject.comments.length !== 1 ? "s" : ""}`
                        : "No comments yet. Start a conversation"}
                    </p>
                  </div>
                </div>
                <FiChevronRight size={24} className="text-blue-500" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  ); 

  const renderCommentsModal = () => (
   <div className="fixed inset-0 bg-white z-[60] flex flex-col">
     {/* Messenger-style Header */}
     <div className="sticky top-0 z-20 bg-white px-4 py-3 flex items-center border-b border-gray-200 shadow-sm">
       <button 
         onClick={() => setShowCommentsModal(false)}
         className="p-2 rounded-full hover:bg-gray-100 mr-2 transition-colors flex-shrink-0"
       >
         <FiChevronLeft size={24} className="text-gray-700" />
       </button>
       
       <Avatar 
         userObj={user}
         size={40}
         className="flex-shrink-0 mr-4"
       />
       
       <div className="flex-1 min-w-0 ml-2">
        <h3 className="text-base font-bold text-gray-900 truncate">{selectedProject?.title}</h3>
        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Active now
        </p>
        </div>
       
       <button className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-2">
         <FiSearch size={20} className="text-gray-600" />
       </button>
       
       <button className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-2">
         <MdPeople size={20} className="text-gray-600" />
       </button>
     </div>

     {/* Messenger Chat Area */}
     <div className="flex-1 overflow-y-auto bg-contain bg-gray-50 p-4">
       <div className="max-w-3xl mx-auto space-y-1">
         {/* Date Separator */}
         <div className="flex justify-center my-6">
           <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
             {(() => {
               if (!selectedProject?.comments || selectedProject.comments.length === 0) {
                 return "Today";
               }
               
               // Get the earliest comment date
               const oldestComment = selectedProject.comments.reduce((oldest, current) => {
                 const oldestDate = new Date(oldest.created_at);
                 const currentDate = new Date(current.created_at);
                 return currentDate < oldestDate ? current : oldest;
               });
               
               const commentDate = new Date(oldestComment.created_at);
               const today = new Date();
               
               // Reset times to compare dates only
               today.setHours(0, 0, 0, 0);
               commentDate.setHours(0, 0, 0, 0);
               
               const diffTime = today - commentDate;
               const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
               
               if (diffDays === 0) {
                 return "Today";
               } else if (diffDays === 1) {
                 return "Yesterday";
               } else if (diffDays < 7) {
                 return `${diffDays} days ago`;
               } else if (diffDays < 30) {
                 const weeks = Math.floor(diffDays / 7);
                 return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
               } else if (diffDays < 365) {
                 const months = Math.floor(diffDays / 30);
                 return `${months} month${months !== 1 ? 's' : ''} ago`;
               } else {
                 const years = Math.floor(diffDays / 365);
                 return `${years} year${years !== 1 ? 's' : ''} ago`;
               }
             })()}
           </div>
         </div>

         {selectedProject && selectedProject.comments && selectedProject.comments.length > 0 ? (
           <>
             {/* Previous comments indicator */}
             <div className="text-center my-4">
               <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                 ↑ View previous comments
               </button>
             </div>

             {/* Comments */}
             {selectedProject.comments.map(comment => {
               const isCurrentUser = comment.email === user?.email;
               const commentUser = isCurrentUser ? user : users.find(u => u.email === comment.email);
               
               return (
                 <div key={comment.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}>
                   <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                     {!isCurrentUser && (
                       <div className="flex-shrink-0 mr-2 self-end">
                         <Avatar 
                           userObj={{
                             ...commentUser,
                             profile_image: comment.profile_image || commentUser?.profile_image
                           }} 
                           size={28} 
                         />
                       </div>
                     )}
                     
                     <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
                       {!isCurrentUser && (
                         <span className="text-xs text-gray-600 font-medium mb-1 ml-1">
                           {comment.user || "User"}
                         </span>
                       )}
                       
                       <div className={`relative rounded-2xl px-4 py-2 max-w-[280px] ${
                         isCurrentUser 
                           ? 'bg-blue-500 text-white rounded-br-sm' 
                           : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                       }`}>
                         {/* Messenger-style tail */}
                         {!isCurrentUser ? (
                           <div className="absolute -left-1.5 bottom-0 w-3 h-3 overflow-hidden">
                             <div className="absolute w-3 h-3 bg-white transform rotate-45 translate-y-1/2"></div>
                           </div>
                         ) : (
                           <div className="absolute -right-1.5 bottom-0 w-3 h-3 overflow-hidden">
                             <div className="absolute w-3 h-3 bg-blue-500 transform rotate-45 translate-y-1/2"></div>
                           </div>
                         )}
                         
                         {comment.text && (
                           <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                             {comment.text}
                           </p>
                         )}
                         
                         {comment.attachments && comment.attachments.length > 0 && (
                           <div className={`space-y-2 mt-2 ${comment.text ? 'pt-2 border-t border-opacity-20' : ''} ${
                             isCurrentUser ? 'border-white/30' : 'border-gray-200'
                           }`}>
                             {comment.attachments.map((att, idx) => {
                               const isImage = att.type && (att.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name));
                               
                               return isImage ? (
                                 <div key={idx} className="rounded-lg overflow-hidden border border-opacity-20">
                                   <img
                                     src={att.path}
                                     alt={att.name}
                                     className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                     onClick={() => window.open(att.path, '_blank')}
                                   />
                                   {comment.text && (
                                     <a
                                       href={att.path}
                                       download={att.name}
                                       className={`block text-xs mt-1 px-2 py-1 ${
                                         isCurrentUser 
                                           ? 'text-blue-200 hover:text-white' 
                                           : 'text-gray-500 hover:text-gray-700'
                                       }`}
                                     >
                                       📎 {att.name}
                                     </a>
                                   )}
                                 </div>
                               ) : (
                                 <a
                                   key={idx}
                                   href={att.path || att.data}
                                   download={att.name}
                                   className={`flex items-center text-sm px-3 py-2 rounded-lg transition-colors ${
                                     isCurrentUser 
                                       ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                       : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                   }`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                 >
                                   <FiPaperclip size={16} className="mr-2 flex-shrink-0" />
                                   <span className="truncate flex-1">{att.name}</span>
                                   <span className="text-xs opacity-75 ml-2">
                                     {(att.size / 1024).toFixed(1)}KB
                                   </span>
                                 </a>
                               );
                             })}
                           </div>
                         )}
                       </div>
                       
                       <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                         <span className="text-[10px] text-gray-400 mr-2">
                           {comment.time}
                         </span>
                         {isCurrentUser && (
                           <div className="text-blue-500">
                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                               <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                             </svg>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
           </>
         ) : (
           // Empty state with Messenger-style design
           <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
             <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
               <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v-2h8v2zm0-4h-8V8h8v2z"/>
               </svg>
             </div>
             <p className="text-lg font-medium text-gray-600">No comments yet</p>
             <p className="text-sm text-gray-400 mt-1">Be the first to comment</p>
             <div className="mt-6 text-xs text-gray-400 flex items-center">
               <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
               Messages are end-to-end encrypted
               <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
             </div>
           </div>
         )}
       </div>
     </div>
 
     {/* Messenger Input Area */}
     <div className="bg-white border-t border-gray-200 px-4 py-3">
       {/* Typing indicator */}
       {false && ( // You can conditionally show this
         <div className="flex items-center mb-2 ml-2">
           <div className="flex space-x-1">
             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
           </div>
           <span className="text-xs text-gray-500 ml-2">Someone is typing...</span>
         </div>
       )}
       
       {/* Attachments Preview */}
       {commentAttachments.length > 0 && (
         <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
           <div className="flex items-center justify-between mb-2">
             <div className="text-sm font-medium text-blue-700">
               {commentAttachments.length} attachment{commentAttachments.length !== 1 ? 's' : ''}
             </div>
             <button
               onClick={() => setCommentAttachments([])}
               className="text-sm text-blue-600 hover:text-blue-800"
             >
               Clear all
             </button>
           </div>
           <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
             {commentAttachments.map((att, idx) => (
               <div key={idx} className="relative group">
                 <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm flex-shrink-0">
                   <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                   <span className="truncate max-w-[120px] text-gray-700">{att.name}</span>
                   <button
                     onClick={() => removeAttachment(idx)}
                     className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-1"
                     title="Remove"
                   >
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                     </svg>
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
       
 {/* Input Form - Mobile Optimized */}
 <div className="flex items-center gap-1">
   {/* Left side buttons */}
   <div className="flex items-center flex-shrink-0">
     <button 
       type="button"
       onClick={() => commentFileInputRef.current?.click()}
       className="p-2 text-gray-500 hover:text-blue-600 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
       title="Attach files"
     >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
         <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
       </svg>
     </button>
     
     <button 
       type="button"
       onClick={startCamera}
       className="p-2 text-gray-500 hover:text-green-600 active:bg-gray-100 rounded-full transition-colors touch-manipulation ml-0.5"
       title="Take photo"
     >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
         <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
         <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
       </svg>
     </button>
   </div>
     {/* Oval input */}
  <div className="flex items-center flex-1 bg-gray-100 rounded-full px-3 py-2 shadow-sm">

    {/* Textarea */}
    <textarea
      value={commentText}
      onChange={(e) => setCommentText(e.target.value)}
      placeholder="Message"
      rows={1}
      name="msg"

      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="sentences"
      spellCheck={false}

      inputMode="text"
      enterKeyHint="send"

      className="flex-1 resize-none bg-transparent outline-none text-sm placeholder:text-gray-400 leading-5"

      style={{
        fontSize: "16px",
        WebkitAppearance: "none",
      }}

      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (commentText.trim() || commentAttachments.length > 0) {
            addComment(selectedProject.id);
          }
        }
      }}
    />
  </div>
   
   {/* Send button */}
   <button
     type="button"
     onClick={() => {
       if ((commentText.trim() || commentAttachments.length > 0) && !isSending) {
         addComment(selectedProject.id);
       }
     }}
     disabled={(!commentText.trim() && commentAttachments.length === 0) || isSending}
     className={`p-3 rounded-full transition-all ml-1 flex-shrink-0 touch-manipulation ${
       (commentText.trim() || commentAttachments.length > 0) && !isSending
         ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow'
         : 'bg-gray-200 text-gray-400 cursor-not-allowed'
     }`}
     title="Send message"
     style={{ 
       minWidth: '44px',
       minHeight: '44px',
       WebkitTapHighlightColor: 'transparent',
     }}
   >
     {isSending ? (
       <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
       </svg>
     ) : (
       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
         <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151495 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0766019 0.837654326,3.16592693 1.15159189,3.95141385 L3.03521743,10.3924068 C3.03521743,10.5495042 3.19218622,10.7066015 3.50612381,10.7066015 L16.6915026,11.4920884 C16.6915026,11.4920884 17.1624089,11.4920884 17.1624089,11.0051895 L17.1624089,12.4744748 C17.1624089,12.4744748 17.1624089,12.4744748 16.6915026,12.4744748 Z"/>
       </svg>
     )}
   </button>
 </div>
       
       <input
         ref={commentFileInputRef}
         type="file"
         multiple
         onChange={handleCommentFileChange}
         style={{ display: 'none' }}
       />
     </div>
     
   </div>
 );

  const renderLocationHistory = (item) => (
    <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex justify-center items-center mr-3">
        <MdLocationOn size={24} className="text-blue-500" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-800 mb-1">{item.location}</div>
        <div className="text-xs text-gray-500">
          <div>{item.date} at {item.time}</div>
        </div>
      </div>
    </div>
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result;
        setSelectedFile(imageData);
        try {
          const response = await fetch('/backend/profile.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({profile_image: imageData})
          });
          const data = await response.json();
          console.log('Profile update response:', data);
          if (data.status === 'success') {
            // Update user object in localStorage with new profile image
            const updatedUser = { ...user, profile_image: imageData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert('Profile image updated successfully');
          } else {
            console.error('Profile update error:', data.message);
            alert('Failed to update profile image: ' + (data.message || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          alert('Error updating profile image: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfile = () => (
    <div className="h-full flex flex-col">
      {/* Profile Header */}
      <div className="bg-blue-500 px-5 py-4 flex justify-between items-center text-white">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full border-2 border-white mr-3 overflow-hidden">
            <Avatar
              userObj={{
                ...user,
                uploaded_profile_image: selectedFile || user?.uploaded_profile_image,
                profile_image: selectedFile || user?.uploaded_profile_image || user?.profile_image,
              }}
              size={48}
            />
          </div>
          <div>
            <div className="text-xl font-bold">My Profile</div>
            <div className="flex items-center mt-1 text-xs">
              <div
                className={`w-2 h-2 rounded-full mr-2`}
                style={{ backgroundColor: userStatus === "Active" ? "#4CAF50" : "#F44336" }}
              ></div>
              Status: {userStatus}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setProfileOpen(false)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <IoMdClose size={24} />
        </button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-auto p-5 bg-gray-50">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-blue-100 overflow-hidden">
                <Avatar
                  userObj={{
                    ...user,
                    uploaded_profile_image: selectedFile || user?.uploaded_profile_image,
                    profile_image: selectedFile || user?.uploaded_profile_image || user?.profile_image,
                  }}
                  size={112}
                />
              </div>
              <button 
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full border-4 border-white hover:bg-blue-600"
                onClick={() => fileInputRef.current.click()}
              >
                <FiCamera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{display: 'none'}} 
              />
            </div>
            <h3 className="text-xl font-bold mb-1"> {formatAuthorName(user?.email)}</h3> 
            <p className="text-gray-500 mb-2">{user?.role || "N/A"}</p>
            <p className="text-sm text-gray-600 mb-1">{user?.email || "N/A"}</p>
            <p className="text-sm text-gray-600">{user?.phone || "N/A"}</p>
          </div>

          {/* Department Info */}
          <div className="border-t pt-4">
            <h4 className="font-bold text-gray-700 mb-2">Department Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Employee ID</p>
                <p className="font-medium">{user?.employeeId || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium">{user?.department || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Join Date</p>
                <p className="font-medium">{user?.joinDate || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Work Hours</p>
                <p className="font-medium">{user?.workHours || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3 mb-6">
          <h4 className="font-bold text-gray-700 mb-2 px-2">Quick Actions</h4>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <FiSettings size={22} className="text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Account Settings</div>
              <div className="text-xs text-gray-500">Manage your account preferences</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
              <MdDashboard size={22} className="text-purple-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">My Projects</div>
              <div className="text-xs text-gray-500">View and manage projects</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <MdLocationOn size={22} className="text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Location History</div>
              <div className="text-xs text-gray-500">Check your location logs</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <MdReportProblem size={22} className="text-yellow-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Daily Reports</div>
              <div className="text-xs text-gray-500">Submit and view reports</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <FaUser size={22} className="text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Help & Support</div>
              <div className="text-xs text-gray-500">Get assistance and FAQs</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <h4 className="font-bold text-gray-700 mb-3">Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Notifications</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Location Sharing</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button - UPDATED ICON */}
        <button
          className="w-full py-4 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center hover:bg-red-600 transition-colors active:bg-red-700 mb-4"
          onClick={() => {
            logout();
            setProfileOpen(false);
          }}
        >
          <FaSignOutAlt size={20} className="mr-2" />
          Logout Account
        </button>

        {/* App Version */}
        <div className="text-center text-gray-400 text-sm py-3 border-t">
          <p>Construction Manager Pro v2.1.4</p>
          <p className="text-xs mt-1">Last updated: Today, 10:30 AM</p>
        </div>
      </div>
    </div>
  );

  // Shimmer/Skeleton Loading Component
  const ShimmerCard = () => (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-lg animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

  const ShimmerStatsCard = () => (
    <div className="bg-gradient-to-br from-gray-300 to-gray-200 text-white rounded-2xl p-4 shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-400 rounded w-12 mb-2"></div>
          <div className="h-3 bg-gray-400 rounded w-24"></div>
        </div>
        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );

  const ShimmerProjectCard = () => (
    <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg animate-pulse">
      <div className="h-5 bg-gray-200 rounded mb-3 w-2/3"></div>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    const filteredProjects = selectedFilter === "all" ? projects : projects.filter(p => p.status === selectedFilter);
    
    switch (activeTab) {
      case "Home":
        return (
          <div className="p-5">

            {/* Enhanced Search and Filter Bar */}
                  <div className="mb-8">
                    {/* Search Bar with Icon and Date Filter */}
                    <div className="flex gap-2 mb-5">
                      <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Search announcements..."
                          className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm hover:shadow-md"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      {/* Compact Date Filter Icon Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowDateFilterMenu(!showDateFilterMenu)}
                          className="h-[52px] w-[52px] flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm hover:shadow-md"
                        >
                          <MdCalendarToday size={22} className={`${dateFilter !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </button>
                        {/* Backdrop Overlay */}
                        {showDateFilterMenu && (
                          <div 
                            className="fixed inset-0 bg-black/30 z-40"
                            onClick={() => setShowDateFilterMenu(false)}
                          ></div>
                        )}
                        
                        {/* Date Filter Dropdown Menu */}
                        {showDateFilterMenu && (
                          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-slide-up ">
                            <button
                              onClick={() => {
                                setDateFilter("all");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "all" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>All Time</span>
                              {dateFilter === "all" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            <button
                              onClick={() => {
                                setDateFilter("today");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "today" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>Today</span>
                              {dateFilter === "today" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            <button
                              onClick={() => {
                                setDateFilter("week");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "week" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>This Week</span>
                              {dateFilter === "week" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            <button
                              onClick={() => {
                                setDateFilter("month");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "month" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>This Month</span>
                              {dateFilter === "month" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                            
                            <div className="border-t border-gray-200"></div>
                            
                            {/* Select Date Button - Opens Modal */}
                            <button
                              onClick={() => {
                                setShowDatePicker(true);
                                setShowDateFilterMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                dateFilter === "custom" 
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500" 
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <MdCalendarToday size={18} />
                              <span>Select Date</span>
                              {dateFilter === "custom" && <IoMdCheckmarkCircle size={18} className="ml-auto" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Filter Buttons */}
                    <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "all" 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("all")}
                    >
                      All ({announcements.length})
                    </button>
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "new" 
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("new")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      New ({announcements.filter(a => a.isNew).length})
                      </span>
                    </button>
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "unread" 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("unread")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                      <MdNotifications size={16} />
                      Unread ({announcements.filter(a => a.unread).length})
                      </span>
                    </button>
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "important" 
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("important")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                      ⭐ Important ({announcements.filter(a => a.important).length})
                      </span>
                    </button>
                    <button 
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === "pinned" 
                        ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-200" 
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                      onClick={() => setSelectedFilter("pinned")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                      <MdPushPin size={16} />
                      Pinned ({announcements.filter(a => a.is_pinned).length})
                      </span>
                    </button>
                    </div>
                  </div>
                  
                  {/* Section Header with Action Button */}
                  <div className="mb-6 sticky top-20 bg-gray-100 -mx-5 px-5 py-4 z-10">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 font-serif">
                        <div className="w-1.5 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                        Announcements
                      </h2>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg flex-shrink-0">
                        <MdCalendarToday size={14} className="text-blue-500" />
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                          {dateFilter === "all" && new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {dateFilter === "today" && "Today"}
                          {dateFilter === "week" && "This Week"}
                          {dateFilter === "month" && "This Month"}
                          {dateFilter === "custom" && "Custom Range"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          {filteredAnnouncements.length} {selectedFilter === "all" ? "total announcements" : selectedFilter}
                        </p>
                      </div>
                      {!isLoading && announcements.filter(a => a.unread).length > 0 && (
                        <button 
                          className="px-4 py-2 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Picker Modal - Always shows at top */}
                  {showDatePicker && (
                    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20" onClick={() => setShowDatePicker(false)}>
                      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Select Date Range</h3>
                          <button onClick={() => setShowDatePicker(false)} className="p-1 hover:bg-gray-100 rounded-full">
                            <IoMdClose size={24} className="text-gray-600" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                            <input
                              type="date"
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                            <input
                              type="date"
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                            />
                          </div>
                          
                          <button
                            onClick={() => {
                              if (customDateRange.start && customDateRange.end) {
                                setDateFilter("custom");
                                setShowDateFilterMenu(false);
                                setShowDatePicker(false);
                              }
                            }}
                            disabled={!customDateRange.start || !customDateRange.end}
                            className={`w-full py-3 font-semibold rounded-xl transition-all ${
                              customDateRange.start && customDateRange.end
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Apply Filter
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Announcements List */}
            <div className="mb-8">
              {isLoadingAnnouncements ? (
                <>
                  <ShimmerCard />
                  <ShimmerCard />
                  <ShimmerCard />
                  <ShimmerCard />
                </>
              ) : filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map(renderAnnouncementCard)
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBell size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-gray-600 font-medium">No announcements found</h3>
                  <p className="text-gray-400 text-sm mt-1">Try a different search or filter</p>
                </div>
              )}
            </div>
          </div>
        );

       case "My Location":
        return (
          <div className="relative h-screen w-full overflow-hidden" style={{ overscrollBehavior: 'none', touchAction: 'pan-x pan-y' }}>
            {/* MAP */}
            <div className="absolute inset-0 overflow-hidden">
              <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)} 
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
              >
                {/* Other Users' Location Markers with Profile Images */}
                {otherUsersLocations.map((location) => (
                  <Marker
                    key={`user-${location.user_id}`}
                    longitude={location.longitude}
                    latitude={location.latitude}
                    anchor="center"
                  >
                    <div className="relative">
                      {location.profile_image ? (
                        <img
                          src={location.profile_image}
                          alt={location.email}
                          className="w-10 h-10 rounded-full border-3 border-white shadow-md object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          title={location.email}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-400 rounded-full border-3 border-white shadow-md flex items-center justify-center" title={location.email}>
                          <span className="text-white font-bold text-sm">
                            {location.email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </Marker>
                ))}

                {/* User Location Marker with Profile Image */}
                {userCoordinates.latitude && userCoordinates.longitude && (
                  <Marker 
                    longitude={userCoordinates.longitude} 
                    latitude={userCoordinates.latitude}
                    anchor="center"
                  >
                    <div className="relative flex flex-col items-center justify-center">
                      {/* Radar pulse effect */}
                      <div className="absolute w-14 h-14 rounded-full" style={{
                        animation: 'radar-pulse 2s ease-out infinite'
                      }}></div>

                      {getCurrentUserProfileImage() ? (
                        <div className="relative z-10">
                          <img 
                            src={getCurrentUserProfileImage()}
                            alt="Your location"
                            className="w-14 h-14 rounded-full border-4 border-white shadow-lg object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {user?.email?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Marker>
                )}
              </Map>

              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/20 to-transparent pt-4 px-4 z-20">
                <div className="flex items-center justify-between relative gap-3 mb-2">
                  <button
                    className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow flex-shrink-0"
                    onClick={() => handleTabChange("Home")}
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow flex-1">
                    <div className="text-sm text-gray-500">Current Location</div>
                    <div className="font-bold text-gray-800">{currentLocation}</div>
                  </div>
                  
                  <button
                    onClick={refreshLocation}
                    disabled={isRefreshingLocation}
                    className={`p-3 rounded-full shadow-lg flex-shrink-0 ${isRefreshingLocation ? 'bg-white text-gray-400' : 'bg-white text-blue-500 hover:bg-blue-50'} transition-all`}
                    title="Refresh location"
                  >
                    <FiRefreshCw size={24} className={isRefreshingLocation ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (userCoordinates.latitude && userCoordinates.longitude) {
                        setViewState(prev => ({
                          ...prev,
                          longitude: userCoordinates.longitude,
                          latitude: userCoordinates.latitude,
                          zoom: 15,
                          transitionDuration: 800
                        }));
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-white text-blue-500 hover:bg-blue-50 shadow-lg transition-all flex items-center gap-1.5"
                    title="Go to my location"
                  >
                    <MdMyLocation size={20} />
                    <span className="text-xs font-medium text-gray-700">Go to me</span>
                  </button>
                </div>
              </div>

              {/* Location History */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl h-[40%] flex flex-col z-30" style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'none' }}>
                <div className="px-5 pt-5 pb-0 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Recent Locations</h3>
                    <button className="text-blue-500 text-sm font-medium">View All</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none', touchAction: 'pan-y', overscrollBehaviorY: 'none' }}>
                  {locationHistory.length > 0 ? (
                    locationHistory.map(renderLocationHistory)
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdLocationOn size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600">No location history yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "My Project":
        const totalProjects = projects.length;
        const ongoingProjects = projects.filter(p => p.status === "ongoing").length;
        const completedProjects = projects.filter(p => p.status === "completed").length;
        const pendingProjects = projects.filter(p => p.status === "pending").length;
        
        return (
          <div className="p-4 pb-24">
            {/* Stats Cards - More Compact Mobile Layout */}
            {isLoadingProjects ? (
              <div className="bg-gradient-to-br from-gray-300 to-gray-200 rounded-2xl p-5 mb-6 shadow-lg animate-pulse h-40"></div>
            ) : (
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MdDashboard size={24} />
              My Tasks Overview
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{totalProjects}</div>
                <div className="text-xs opacity-90 font-medium">Total</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{ongoingProjects}</div>
                <div className="text-xs opacity-90 font-medium">Ongoing</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{completedProjects}</div>
                <div className="text-xs opacity-90 font-medium">Done</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold leading-none mb-1">{pendingProjects}</div>
                <div className="text-xs opacity-90 font-medium">Pending</div>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["all", "pending", "ongoing", "scheduled", "completed"].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedFilter(status)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedFilter === status
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Projects List */}
            <div className="mb-6">
              {isLoadingProjects ? (
                <div className="space-y-4">
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                  <ShimmerProjectCard />
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="space-y-3">
                  {filteredProjects.map(renderProjectCard)}
                </div>
              ) : selectedFilter !== "all" ? (
                <div className="text-center py-10">
                  <MdDashboard size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600 font-medium">No {selectedFilter} tasks found</p>
                  <p className="text-sm text-gray-400 mt-1">Try selecting a different filter</p>
                </div>
              ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 text-center shadow-sm border border-gray-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdDashboard size={40} className="text-blue-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">No Tasks Assigned Yet</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">Tasks will appear here when your manager assigns them to you. Check back soon!</p>
          <div className="mt-6 flex justify-center">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Awaiting assignments
            </div>
          </div>
              </div>
            )}
            </div>
          </div>
        );

      case "Profile":
        return !isMobile ? (
          <div className="p-5">
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="text-xl font-bold mb-5">Profile (Desktop View)</h3>
              <p className="text-gray-600 mb-4">
                On larger screens, profile shows inline. On mobile, it slides in as a full-screen sidebar.
              </p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                onClick={() => alert("Desktop profile functions")}
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const ActionMenu = () => (
    <div className="fixed inset-0 z-30 flex justify-center items-end">
      {/* Backdrop - Click outside to close */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowActionMenu(false)}
      />
      
      {/* Bottom Sheet */}
      <div 
        ref={actionMenuRef}
        className="relative bg-white rounded-t-3xl p-5 w-full max-h-[50%] overflow-auto animate-slide-up z-40"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <h3 className="text-xl font-bold mb-5 text-center">Quick Actions</h3>
        
        <button
          className="w-full flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100"
          onClick={() => {
            setShowReportModal(true);
            setShowActionMenu(false);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <MdReportProblem size={20} className="text-blue-500" />
          </div>
          <div className="text-left">
            <div className="font-medium">Submit Report</div>
            <div className="text-xs text-gray-500">Submit daily work report</div>
          </div>
        </button>

        <button
          className="w-full flex items-center p-4 hover:bg-gray-50 active:bg-gray-100"
          onClick={() => alert("Task creation would open here")}
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <MdDashboard size={20} className="text-purple-500" />
          </div>
          <div className="text-left">
            <div className="font-medium">Add New Project</div>
            <div className="text-xs text-gray-500">Create new project</div>
          </div>
        </button>
      </div>
    </div>
  );

  // Progress Update Modal
  const renderProgressUpdateModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Update Progress</h3>
          <button 
            onClick={() => {
              setShowProgressModal(false);
              setCapturedPhoto(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Task Title */}
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Task</p>
            <p className="text-base font-semibold text-gray-900">{selectedTaskForProgress?.title}</p>
          </div>

          {/* Progress Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Progress: <span className="text-blue-600 font-bold">{progressPercentage}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #e5e7eb ${progressPercentage}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea 
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="Add any notes about this progress update..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows="3"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button 
            onClick={() => {
              setShowProgressModal(false);
              setCapturedPhoto(null);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              setShowProgressModal(false);
              setShowPhotoModal(true);
              setIsCapturingLocation(true);
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <MdCamera size={18} className="mr-2" />
            Confirm & Take Photo
          </button>
        </div>
      </div>
    </div>
  );

  // Helper functions for photo modal (at top level)
  const startCameraForModal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setLocationValidationMsg("❌ Unable to access camera");
    }
  };

  const takePhotoForModal = () => {
    if (cameraCanvasRef.current && cameraVideoRef.current) {
      const context = cameraCanvasRef.current.getContext('2d');
      // Resize to max 1080p to reduce file size
      const maxWidth = 1080;
      const maxHeight = 1080;
      let width = cameraVideoRef.current.videoWidth;
      let height = cameraVideoRef.current.videoHeight;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      cameraCanvasRef.current.width = width;
      cameraCanvasRef.current.height = height;
      context.drawImage(cameraVideoRef.current, 0, 0, width, height);
      // Use lower quality (0.7) to reduce file size further
      const photoData = cameraCanvasRef.current.toDataURL('image/jpeg', 0.7);
      setCapturedPhoto(photoData);
    }
  };

  const submitProgressUpdate = async () => {
    if (!capturedPhoto) {
      alert("Please capture a photo before submitting");
      return;
    }

    // Allow submission without location, but warn user
    if (!taskLocation) {
      const confirmSubmit = window.confirm(
        "⚠️ Location not available. Submit without geolocation data?\n\nNote: This evidence will be marked as location unverified."
      );
      if (!confirmSubmit) return;
    }

    try {
      // Use FormData for better handling of large base64 image data
      const formData = new FormData();
      formData.append('action', 'update_progress');
      formData.append('project_id', selectedTaskForProgress.id);
      formData.append('progress_percentage', progressPercentage);
      formData.append('status', progressStatus);
      formData.append('notes', progressNotes);
      formData.append('evidence_photo', capturedPhoto);
      formData.append('location_latitude', taskLocation?.latitude || 0);
      formData.append('location_longitude', taskLocation?.longitude || 0);
      formData.append('location_accuracy', taskLocation?.accuracy || 0);

      const response = await fetch('/backend/project_progress.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      // Get response text first to check for errors
      const responseText = await response.text();
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));
      console.log('Response body:', responseText);
      
      if (!response.ok) {
        console.error('Backend error response:', responseText);
        alert("❌ Server error: " + (responseText || response.statusText));
        return;
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        alert("❌ Server returned invalid response. Please check server logs.");
        return;
      }

      if (data.status === 'success') {
        alert("✅ Progress update submitted successfully!");
        setShowPhotoModal(false);
        setCapturedPhoto(null);
        setTaskLocation(null);
        setProgressPercentage(0);
        setProgressStatus("In Progress");
        setProgressNotes("");
        setSelectedTaskForProgress(null);
        setLocationValidationMsg("");
        // Stop camera
        if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
          cameraVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      } else {
        alert("❌ " + (data.message || "Failed to submit progress"));
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      alert("Error submitting progress: " + error.message);
    }
  };

  // Start camera when modal opens
  useEffect(() => {
    if (showPhotoModal && !capturedPhoto) {
      startCameraForModal();
    }
    return () => {
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        cameraVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [showPhotoModal, capturedPhoto]);

  // Capture location when modal opens
  useEffect(() => {
    if (showPhotoModal && isCapturingLocation) {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setLocationValidationMsg("❌ Geolocation not supported on this device");
        setIsCapturingLocation(false);
        return;
      }

      setLocationValidationMsg("📍 Requesting location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTaskLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationValidationMsg("✅ Location captured successfully");
          setIsCapturingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMsg = "⚠️ Unable to get location. ";
          
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg += "Permission denied. Enable location in settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg += "Position unavailable.";
          } else if (error.code === error.TIMEOUT) {
            errorMsg += "Location request timed out.";
          } else {
            errorMsg += "Please check location settings and try again.";
          }
          
          setLocationValidationMsg(errorMsg);
          setIsCapturingLocation(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 30000,
          maximumAge: 0
        }
      );
    }
  }, [showPhotoModal, isCapturingLocation]);

  // Photo Evidence Modal - Pure render function
  const renderPhotoEvidenceModal = () => {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Photo Evidence</h3>
            <button 
              onClick={() => {
                setShowPhotoModal(false);
                setCapturedPhoto(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-4">
            {/* Location Status */}
            <div className={`p-3 rounded-lg text-sm flex items-center justify-between ${
              locationValidationMsg.includes("✅") ? 'bg-green-50 text-green-700' : 
              locationValidationMsg.includes("❌") ? 'bg-red-50 text-red-700' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              <div className="flex items-center flex-1">
                {isCapturingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2"></div>
                    <span>Capturing location...</span>
                  </>
                ) : (
                  <span>{locationValidationMsg || "Initializing GPS..."}</span>
                )}
              </div>
              {locationValidationMsg.includes("❌") && !isCapturingLocation && (
                <button
                  onClick={() => setIsCapturingLocation(true)}
                  className="ml-2 px-2 py-1 text-xs font-medium bg-white rounded hover:bg-gray-100 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>

            {/* Camera Preview or Photo */}
            <div className="bg-black rounded-lg overflow-hidden aspect-square relative">
              {!capturedPhoto ? (
                <>
                  <video 
                    ref={cameraVideoRef}
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
                </>
              ) : (
                <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Progress Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Progress</p>
                  <p className="font-bold text-gray-900">{progressPercentage}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-bold text-gray-900">{progressStatus}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
            {!capturedPhoto ? (
              <>
                <button 
                  onClick={() => {
                    setShowPhotoModal(false);
                    setCapturedPhoto(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={takePhotoForModal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MdCamera size={18} className="mr-2" />
                  Capture
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setCapturedPhoto(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Retake
                </button>
                <button 
                  onClick={submitProgressUpdate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <MdCheck size={18} className="mr-2" />
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const unreadCount = announcements.filter(a => a.unread).length;

  return (
    <div className="min-h-screen pb-20 bg-gray-100 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-800 text-2xl font-bold">Loading...</p>
          </div>
        </div>
      )}
      {/* Main Header */}
      {activeTab !== "My Location" && (
        <div className="sticky top-0 z-20 bg-blue-500 px-5 py-4 flex justify-between items-center text-white">
          <div className="flex items-center">
            {isMobile && activeTab !== "Profile" && (
             <button 
            onClick={() => setProfileOpen(true)}
                className="mr-3 p-1 rounded-full bg-white/90 hover:bg-white transition-colors shadow"
                >
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
                    <img
                    src="/img/stelsenlogo.png"
                    alt="Menu"
                    className="w-8 h-8 object-contain"
                    />
                </div>
            </button>
            )}
            <div>
              <div className="text-xl font-bold">
              {formatAuthorName(user?.email)}!
              </div>
              <div className="flex items-center mt-1 text-xs">
                <div
                  className={`w-2 h-2 rounded-full mr-2`}
                  style={{ backgroundColor: userStatus === "Active" ? "#44eb4a" : "#F44336" }}
                ></div>
                Status: {userStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full border-2 border-white cursor-pointer overflow-hidden"
              onClick={handleProfileClick}
            >
              <Avatar
                userObj={{
                  ...user,
                  uploaded_profile_image: selectedFile || user?.uploaded_profile_image,
                  profile_image: selectedFile || user?.uploaded_profile_image || user?.profile_image,
                }}
                size={40}
              />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${(profileOpen || showActionMenu) && isMobile ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="overflow-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navbar with Centered Add Button */}
      {activeTab !== "My Location" && (
        <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex items-center justify-around py-2 z-10 transition-all duration-300 ${(profileOpen || showActionMenu) ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
          {/* Home Button */}
          <button
            className={`flex flex-col items-center relative ${activeTab === "Home" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("Home")}
          >
            <IoMdHome size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>

          {/* My Project Button */}
          <button
            className={`flex flex-col items-center relative ${activeTab === "My Project" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("My Project")}
          >
            <MdDashboard size={24} />
            <span className="text-xs mt-1">Projects</span>
          </button>

          {/* Centered Add Button */}
          <div className="relative -top-6">
            <button
              onClick={() => setShowActionMenu(true)}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              <MdAdd size={32} />
            </button>
          </div>
        
          {/* My Location Button */}
          <button
            className={`flex flex-col items-center relative ${activeTab === "My Location" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => handleTabChange("My Location")}
          >
            <MdLocationOn size={24} />
            <span className="text-xs mt-1">Location</span>
          </button>

          {/* Profile Button */}
          <button
            className={`flex flex-col items-center relative ${activeTab === "Profile" ? "text-blue-500" : "text-gray-500"}`}
            onClick={handleProfileClick}
          >
            <FaUser size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      )}

      {/* Action Menu Modal */}
      {showActionMenu && <ActionMenu />}

      {/* Profile Sidebar/Drawer - Full Width */}
      {profileOpen && isMobile && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-30 flex flex-col">
          {renderProfile()}
        </div>
      )}

      {/* Location Update Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-40">
          <div className="bg-white rounded-t-3xl p-5 w-full max-h-[80%] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-bold">Update Location</span>
              <button onClick={() => setShowLocationModal(false)}>Close</button>
            </div>
            {["Office", "Site A", "Site B", "Client Meeting", "On The Way", "Break"].map(location => (
              <button
                key={location}
                className="flex justify-between items-center w-full py-4 border-b border-gray-100"
                onClick={() => updateLocation(location)}
              >
                <MdLocationOn size={20} className="text-blue-500" />
                <span>{location}</span>
                <FiChevronRight size={20} className="text-gray-500" />
              </button>
            ))}
            <button
              className="flex items-center py-4 mt-3"
              onClick={() => alert("Add custom location")}
            >
              <FiPlus size={20} className="text-blue-500" />
              <span className="ml-2 text-blue-500">Add Custom Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-40">
          <div className="bg-white rounded-t-3xl p-5 w-full max-h-[70%] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-bold">Submit Daily Report</span>
              <button onClick={() => setShowReportModal(false)}>Close</button>
            </div>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg mb-5"
              rows={6}
              placeholder="Describe your work, progress, or any issues..."
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
            />
            <button
              className={`w-full py-4 rounded-lg ${reportMessage.trim() ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-700"}`}
              disabled={!reportMessage.trim()}
              onClick={submitReport}
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Task Details - Stack Navigation */}
      {getCurrentScreen()?.screen === "projectDetails" && renderProjectDetailsModal()}

      {/* Comments Modal - Reset navigation stack */}
      {showCommentsModal && (() => {
        // Reset navigation stack when comments modal is open
        if (navigationStack.length > 0) {
          setNavigationStack([]);
        }
        return renderCommentsModal();
      })()}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Take Photo</h3>
              <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                <IoMdClose size={24} />
              </button>
            </div>
            
            <div className="relative bg-black">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="p-4 flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <FiCamera size={20} />
                Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && renderProgressUpdateModal()}

      {/* Photo Evidence Modal */}
      {showPhotoModal && renderPhotoEvidenceModal()}
    </div>
  );
};

export default UserDashboard;