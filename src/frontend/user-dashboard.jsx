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
  MdCheckCircle,
  MdPerson,
  MdWork,
  MdChatBubble,
  MdCalendarToday,
  MdComment,
  MdPushPin
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
  FiFilter
} from "react-icons/fi";
import { 
  HiOutlineChatAlt2,
  HiOutlineClipboardList
} from "react-icons/hi";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const UserDashboard = ({ user, logout }) => {
  const [activeTab, setActiveTab] = useState("Home");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Office");
  const [reportMessage, setReportMessage] = useState("");
  const [userStatus, setUserStatus] = useState("Active");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const actionMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [users, setUsers] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [readComments, setReadComments] = useState(() => {
    try {
      const saved = localStorage.getItem('userDashboardReadComments');
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error('Error loading read comments:', err);
      return {};
    }
  });

  // Save read comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userDashboardReadComments', JSON.stringify(readComments));
    } catch (err) {
      console.error('Error saving read comments:', err);
    }
  }, [readComments]);

  const [center, setCenter] = useState({
    lat: 14.5995,
    lng: 120.9842,
  });

  // Enhanced announcements data
  const [announcements, setAnnouncements] = useState([

  ]);

  // Filtered announcements
  const filteredAnnouncements = announcements.filter(ann => {
    if (selectedFilter === "unread") return ann.unread;
    if (selectedFilter === "important") return ann.important;
    if (selectedFilter === "read") return !ann.unread;
    return true;
  }).filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // 🔒 Helper function to check for session expiry and auto-logout
  const handleApiResponse = async (response) => {
    if (!response.ok) {
      return response.json().then(data => {
        if (data.message === "Unauthorized") {
          console.error("Session expired - logging out");
          logout();
        }
        throw new Error(data.message || "API request failed");
      });
    }
    return response.json();
  };

  useEffect(() => {
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/backend/announcements.php", {
        credentials: "include",
      });
      const data = await handleApiResponse(res);
      const normalized = data.map(a => ({
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
        is_pinned: a.is_pinned === 1,
        icon: getIconForType(a.type),
      }));

      setAnnouncements(normalized);
    } catch (err) {
      console.error("Announcement fetch error:", err);
    }
  };

  fetchAnnouncements();
  const interval = setInterval(fetchAnnouncements, 10000); // Poll every 10 seconds

  return () => clearInterval(interval);
}, []);

// Fetch users for names/avatars
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await fetch("/backend/users.php", { credentials: "include" });
      const data = await handleApiResponse(res);
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

// Fetch projects assigned to current user
useEffect(() => {
  const fetchProjects = async () => {
    try {
      const response = await fetch("/backend/projects.php", {
        method: "GET",
        credentials: "include",
      });
      const data = await handleApiResponse(response);
      
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
            const commentsData = await handleApiResponse(commentsRes);
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
            return { ...project, comments };
          } catch (err) {
            console.error(`Failed to fetch comments for project ${project.id}:`, err);
            return { ...project, comments: [] };
          }
        })
      );
      
      setProjects(projectsWithComments);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  if (user?.id) {
    fetchProjects();
    // Refresh projects every 10 seconds to stay in sync
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Location access denied")
    );
  }, []);

  // Mark a specific announcement as read
  // This function sends a request to the backend and updates the local state
  const markAsRead = async (id) => {
    try {
      const res = await fetch("/backend/announcements.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
      const data = await handleApiResponse(res);
      if (data.status !== "success") {
        console.error("Mark as read failed:", data.message);
      }
      setAnnouncements(prev =>
        prev.map(a => a.id === id ? { ...a, unread: false } : a)
      );
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  // Toggle pin state for an announcement
  const togglePin = async (id, nextPinned) => {
    try {
      const res = await fetch("/backend/announcements.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", id, pinned: nextPinned })
      });
      const data = await handleApiResponse(res);
      if (data.status !== "success") {
        console.error("Pin update failed:", data.message);
        return;
      }
      setAnnouncements(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, is_pinned: nextPinned } : a);
        return [...updated].sort((a, b) => (b.is_pinned - a.is_pinned));
      });
    } catch (err) {
      console.error("Toggle pin error:", err);
    }
  };

  const [projects, setProjects] = useState([]);

  const [locationHistory, setLocationHistory] = useState([
    { id: "1", location: "Main Office", time: "09:00 AM", date: "2024-12-10" },
    { id: "2", location: "Site A", time: "10:30 AM", date: "2024-12-10" },
    { id: "3", location: "Client Office", time: "02:00 PM", date: "2024-12-10" },
    { id: "4", location: "Site B", time: "04:45 PM", date: "2024-12-10" },
  ]);

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
      case "pending": return "bg-red-500";
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

  const viewProjectDetails = async (project) => {
    // Prime selected project immediately
    setSelectedProject({ ...project, comments: project.comments || [] });
    setShowProjectDetailsModal(true);

    // Fetch fresh comments for this project
    try {
      const res = await fetch(`/backend/comments.php?project_id=${project.id}`, { credentials: "include" });
      const data = await handleApiResponse(res);
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

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("text", commentText);
      
      // Append actual file objects for multipart upload
      commentAttachments.forEach((attachment) => {
        formData.append("attachments[]", attachment.rawFile);
      });

      const response = await fetch("/backend/comments.php", {
        method: "POST",
        credentials: "include",
        body: formData, // FormData automatically sets multipart/form-data
      });

      const data = await response.json();
      if (data.status === "success") {
        const newCommentObj = {
          id: data.comment_id || Date.now(),
          user: data.user || formatAuthorName(user?.email),
          text: commentText,
          time: "Just now",
          created_at: new Date().toISOString(),
          profile_image: data.profile_image || getCurrentUserProfileImage(),
          email: data.email || user?.email,
          attachments: data.attachments || null,
        };

        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, comments: [...(p.comments || []), newCommentObj] } : p));

        setSelectedProject(prev => prev && prev.id === projectId
          ? { ...prev, comments: [...(prev.comments || []), newCommentObj] }
          : prev
        );

        setCommentText("");
        setCommentAttachments([]);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
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
        audio: false 
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
            rawFile: file
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
        const data = await handleApiResponse(res);
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
  const Avatar = ({ userObj, size = 32 }) => {
    const initial =
      userObj?.name?.charAt(0) ||
      userObj?.email?.charAt(0) ||
      "?";

    const [imgError, setImgError] = useState(false);

    // PRIORITY: profile_image → fallback to initials
    const imageSrc = userObj?.profile_image || null;

    if (!imageSrc || imgError) {
      return (
        <div
          className="bg-blue-500 text-white font-bold flex items-center justify-center rounded-full"
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
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  };

//========================================================== Render Functions ==========================================================
const renderAnnouncementCard = (announcement) => (
  <div
    key={announcement.id}
    className={`bg-white rounded-2xl p-4 mb-3 shadow-lg ${
      announcement.unread ? "border-l-4 border-blue-500" : ""
    }`}
    onClick={() => markAsRead(announcement.id)}
  >
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
        {announcement.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePin(announcement.id, !announcement.is_pinned);
          }}
          className={(announcement.is_pinned ? "text-yellow-500" : "text-gray-400") + " hover:text-yellow-600"}
          title={announcement.is_pinned ? "Unpin" : "Pin"}
        >
          <MdPushPin size={18} />
        </button>
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
            <div className="flex items-center text-green-500 text-sm">
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
    <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-lg hover:shadow-xl transition-all">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center flex-1">
          <MdDashboard size={20} className="text-blue-500" />
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
          <span></span>
          <span className="font-bold">{item.progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
          <span className="flex items-center text-xs text-gray-500 relative">
            <MdComment size={14} className="mr-1" />
            {(item.comments && item.comments.length) || 0}
            {unreadCount > 0 && (
              <div className="absolute -top-0.5 -right-0.1 w-2 h-2 bg-red-500 rounded-full "></div>
            )}
          </span>
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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-end z-50">
      <div className="bg-white rounded-t-3xl p-5 w-full max-h-[90%] overflow-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">Tasks Details</h3>
          <button 
            onClick={() => setShowProjectDetailsModal(false)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <IoMdClose size={24} className="text-gray-600" />
          </button>
        </div>

        {selectedProject && (
          <>
            <div className="flex flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-800 flex-1">{selectedProject.title}</h4>
              <div className="flex-shrink-0">
                <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedProject.status)} text-white text-xs inline-block`}>
                  {selectedProject.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="space-y-3 sm:space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wide">Assigned Employees</p>
                  <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 min-h-[150px] sm:min-h-[200px] overflow-y-auto flex flex-wrap gap-1 sm:gap-2 items-start content-start">
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
                  <p className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Team Users</p>
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedProject.team_users || 0} users</p>
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

  const renderCommentsModal = () => {
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col md:rounded-2xl md:w-[90%] md:h-[90%] md:left-[5%] md:top-[5%] md:bottom-auto md:mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-5 py-3 md:py-4 flex items-center text-white shadow-lg rounded-t-none md:rounded-t-2xl">
          <button 
            onClick={() => setShowCommentsModal(false)}
            className="p-2 rounded-full hover:bg-white/20 mr-3 transition-colors flex-shrink-0"
          >
            <FiChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold truncate">Comments & Clarifications</h3>
            <p className="text-xs opacity-90 truncate">{selectedProject?.title}</p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50">
          {selectedProject && selectedProject.comments && selectedProject.comments.length > 0 ? (
            <div className="space-y-3">
              {selectedProject.comments.map(comment => {
                const isCurrentUser = comment.email === user?.email;
                const commentUser = isCurrentUser ? user : users.find(u => u.email === comment.email);
                
                return (
                  <div key={comment.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-2 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar 
                        userObj={{
                          ...commentUser,
                          profile_image: comment.profile_image || commentUser?.profile_image
                        }} 
                        size={36} 
                      />
                      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        <div className={`${
                          isCurrentUser 
                            ? (comment.text ? 'bg-blue-500 text-white' : 'bg-transparent')
                            : 'bg-white text-gray-800 border border-gray-200'
                        } rounded-2xl px-4 py-3 shadow-sm`}>
                          {comment.text && <p className="text-sm leading-relaxed">{comment.text}</p>}
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className={`space-y-2 ${
                              comment.text ? 'mt-3 border-t pt-2 border-opacity-30' : ''
                            }`}>
                              {comment.attachments.map((att, idx) => {
                                const isImage = att.type && (att.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name));
                                return isImage ? (
                                  <div key={idx} className="mt-2">
                                    <img
                                      src={att.path}
                                      alt={att.name}
                                      className={`rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity ${
                                        comment.text ? 'w-full max-w-[280px] max-h-56' : 'w-full max-h-96'
                                      }`}
                                      onClick={() => window.open(att.path, '_blank')}
                                    />
                                    <a
                                      href={att.path}
                                      download={att.name}
                                      className="block text-xs mt-1 text-blue-400 hover:underline"
                                    >
                                      Download: {att.name}
                                    </a>
                                  </div>
                                ) : (
                                  <a
                                    key={idx}
                                    href={att.path || att.data}
                                    download={att.name}
                                    className={`flex items-center text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity ${
                                      isCurrentUser ? 'bg-blue-400' : 'bg-gray-200'
                                    }`}
                                    target={att.path ? '_blank' : undefined}
                                    rel={att.path ? 'noopener noreferrer' : undefined}
                                  >
                                    <FiPaperclip size={14} className="mr-1" />
                                    {att.name}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-2">{comment.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MdComment size={64} className="opacity-30 mb-3" />
              <p className="text-lg font-medium">No comments yet</p>
              <p className="text-sm">Start the conversation below</p>
            </div>
          )}
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="bg-white border-t border-gray-200 p-3 md:p-4 flex-shrink-0">
          {/* Attachments Preview */}
          {commentAttachments.length > 0 && (
            <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-2">{commentAttachments.length} file(s) attached</div>
              <div className="flex flex-wrap gap-2 max-h-[60px] overflow-y-auto">
                {commentAttachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-1 text-xs flex-shrink-0 hover:bg-blue-100">
                    <FiPaperclip size={12} className="text-blue-600 flex-shrink-0" />
                    <span className="truncate max-w-[100px]">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Avatar userObj={user} size={32} className="flex-shrink-0" />
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 md:px-4 py-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (commentText.trim() || commentAttachments.length > 0)) {
                    addComment(selectedProject.id);
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent outline-none text-sm"
                autoFocus
              />
              <button 
                onClick={() => commentFileInputRef.current?.click()}
                className={`text-gray-400 hover:text-blue-600 ml-2 flex-shrink-0 transition-colors ${
                  commentAttachments.length > 0 ? 'text-blue-600' : ''
                }`}
                title="Attach files"
              >
                <FiPaperclip size={18} />
              </button>
              <button 
                onClick={startCamera}
                className="text-gray-400 hover:text-green-600 ml-2 flex-shrink-0 transition-colors"
                title="Take photo"
              >
                <FiCamera size={18} />
              </button>
              <input
                ref={commentFileInputRef}
                type="file"
                multiple
                onChange={handleCommentFileChange}
                style={{ display: 'none' }}
              />
            </div>
            <button
              onClick={() => {
                if (commentText.trim() || commentAttachments.length > 0) {
                  addComment(selectedProject.id);
                }
              }}
              disabled={!commentText.trim() && commentAttachments.length === 0}
              className={`p-2 md:p-3 rounded-full transition-all flex-shrink-0 ${
                (commentText.trim() || commentAttachments.length > 0)
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <IoMdSend size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationHistory = (item) => (
    <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex justify-center items-center mr-3">
        <MdLocationOn size={24} className="text-blue-500" />
      </div>
      <div className="flex-1">
        <div className="font-medium mb-1">{item.location}</div>
        <div className="flex items-center text-xs text-gray-500">
          <span>{item.time}</span>
          <span className="ml-3">{item.date}</span>
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
          <img 
            src={selectedFile || user?.profile_image} 
            className="w-12 h-12 rounded-full border-2 border-white mr-3"
            alt="User"
          />
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
              <img 
                src={selectedFile || user?.profile_image} 
                className="w-28 h-28 rounded-full border-4 border-blue-100" 
                alt="Profile"
              />
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
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <MdDashboard size={22} className="text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">My Projects</div>
              <div className="text-xs text-gray-500">View and manage projects</div>
            </div>
            <FiChevronRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
              <MdLocationOn size={22} className="text-purple-500" />
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "Home":
        return (
          <div className="p-5">

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>


            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === "all" 
                    ? "bg-blue-500 text-white shadow" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedFilter("all")}
              >
                All ({announcements.length})
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === "unread" 
                    ? "bg-blue-500 text-white shadow" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedFilter("unread")}
              >
                Unread ({announcements.filter(a => a.unread).length})
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === "important" 
                    ? "bg-blue-500 text-white shadow" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedFilter("important")}
              >
                Important ({announcements.filter(a => a.important).length})
              </button>
            </div>

            {/* Announcements Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Announcements</h2>
              <button 
                className="text-blue-500 text-sm font-medium flex items-center"
                onClick={markAllAsRead}
              >
                <MdCheckCircle className="mr-1" size={16} />
                Mark all as read
              </button>
            </div>

            {/* Announcements List */}
            <div className="mb-8">
              {filteredAnnouncements.length > 0 ? (
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
          <div className="relative h-screen w-full overflow-hidden">
            {/* MAP */}
            <div className="absolute inset-0">
              <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <div style={{ width: "100%", height: "100%" }}>
                  <GoogleMap
                    mapContainerStyle={{
                      width: "100%",
                      height: "100%",
                    }}
                    center={center}
                    zoom={15}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      clickableIcons: false,
                      styles: [
                        {
                          featureType: "poi",
                          elementType: "labels",
                          stylers: [{ visibility: "off" }]
                        }
                      ]
                    }}
                  >
                    <Marker 
                      position={center}
                      icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                      }}
                    />
                  </GoogleMap>
                </div>
              </LoadScript>

              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/20 to-transparent pt-4 px-4">
                <div className="flex items-center justify-between">
                  <button
                    className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    onClick={() => handleTabChange("Home")}
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow">
                    <div className="text-sm text-gray-500">Current Location</div>
                    <div className="font-bold text-gray-800">{currentLocation}</div>
                  </div>
                  <button
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    onClick={() => setShowLocationModal(true)}
                  >
                    <MdLocationOn size={24} />
                  </button>
                </div>
              </div>

              {/* Location History */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-2xl h-[45%]">
                <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Recent Locations</h3>
                  <button className="text-blue-500 text-sm font-medium">View All</button>
                </div>
                <div className="overflow-auto h-[calc(100%-4rem)]">
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
          <div className="p-5">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-5 mb-5 shadow-lg">
              <h3 className="text-lg font-bold mb-4">My Tasks Overview</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalProjects}</div>
                  <div className="text-xs opacity-90">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{ongoingProjects}</div>
                  <div className="text-xs opacity-90">Ongoing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{completedProjects}</div>
                  <div className="text-xs opacity-90">Done</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{pendingProjects}</div>
                  <div className="text-xs opacity-90">Pending</div>
                </div>
              </div>
            </div>
            
            {projects.length > 0 ? (
              projects.map(renderProjectCard)
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <MdDashboard size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No tasks assigned yet</p>
                <p className="text-sm text-gray-400 mt-1">Tasks will appear here when assigned by admin</p>
              </div>
            )}
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

  const unreadCount = announcements.filter(a => a.unread).length;

  return (
    <div className="min-h-screen pb-20 bg-gray-100 relative">
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
                  className={`w-4 h-4 rounded-full mr-2`}
                  style={{ backgroundColor: userStatus === "Active" ? "#4CAF50" : "#F44336" }}
                ></div>
                Status: {userStatus}
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src={selectedFile || user?.profile_image} 
              className="w-10 h-10 rounded-full border-2 border-white cursor-pointer"
              onClick={handleProfileClick}
              alt="User Avatar"
            />
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

      {/* Task Details Bottom Sheet */}
      {showProjectDetailsModal && renderProjectDetailsModal()}

      {/* Comments Modal */}
      {showCommentsModal && renderCommentsModal()}

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
    </div>
  );
};

export default UserDashboard;