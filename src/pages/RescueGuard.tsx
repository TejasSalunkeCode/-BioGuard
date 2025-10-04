import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Video,
  MapPin,
  Navigation,
  AlertTriangle,
  Hospital as HospitalIcon,
  PhoneCall,
  Search,
  Loader2,
  Mic,
  MicOff,
  Video as VideoIcon,
  PhoneOff,
  Share2,
  Users,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  GeolocationService,
  HospitalService,
  EmergencyAlertService,
  Location,
  Hospital,
} from "@/lib/emergencyServices";
import { VideoCallService, EmergencyCallService } from "@/lib/videoCallService";

const RescueGuard = () => {
  const [activeTab, setActiveTab] = useState("emergency");
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isEmergencyCallActive, setIsEmergencyCallActive] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const videoCallService = useRef(new VideoCallService());
  const emergencyCallService = useRef(new EmergencyCallService());

  const initializeLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await GeolocationService.getCurrentLocation();
      setUserLocation(location);

      // Load nearby hospitals
      setIsLoadingHospitals(true);
      const hospitals = await HospitalService.getNearbyHospitals(location);
      setNearbyHospitals(hospitals);

    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Failed to get your location. Some features may not work properly.');
    } finally {
      setIsLoadingLocation(false);
      setIsLoadingHospitals(false);
    }
  };

  // Initialize location and hospitals on mount
  useEffect(() => {
    const videoCallServiceRef = videoCallService.current;
    initializeLocation();
    return () => {
      videoCallServiceRef.endCall();
    };
  }, []);

  const handleEmergencyCall = async (type: 'medical' | 'police' | 'fire' | 'ambulance') => {
    setIsEmergencyCallActive(true);
    try {
      // Use WhatsApp for emergency contact
      const emergencyNumber = '917219435156';
      const whatsappUrl = `https://wa.me/${emergencyNumber}?text=EMERGENCY%20-%20${type.toUpperCase()}%20assistance%20needed`;
      
      window.open(whatsappUrl, '_blank');

      // Also send emergency alert with location
      if (userLocation) {
        await EmergencyAlertService.sendEmergencyAlert(
          userLocation,
          `Emergency call initiated: ${type.toUpperCase()}`
        );
      }

      toast.success(`Opening WhatsApp for ${type} emergency`, {
        description: 'Connecting to emergency contact',
      });
    } catch (error) {
      console.error('Emergency call failed:', error);
      toast.error('Failed to initiate emergency call');
    } finally {
      setIsEmergencyCallActive(false);
    }
  };

  const handleVideoCall = () => {
    const phoneNumber = '7219435156';
    
    // Detect platform
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Android: Try native video call intent
      // This will prompt the user to choose a video calling app
      try {
        window.location.href = `tel:${phoneNumber}`;
        toast.success('Initiating call...', {
          description: 'Use your phone\'s video call feature',
        });
      } catch (error) {
        // Fallback to WhatsApp
        window.location.href = `https://wa.me/91${phoneNumber}`;
        toast.info('Opening WhatsApp', {
          description: 'Tap the video icon to start video call',
        });
      }
    } else if (isIOS) {
      // iOS: Use FaceTime for video calls
      window.location.href = `facetime:${phoneNumber}`;
      toast.success('Opening FaceTime...', {
        description: 'Video calling ' + phoneNumber,
      });
    } else {
      // Desktop: Open WhatsApp Web
      window.open(`https://wa.me/91${phoneNumber}`, '_blank');
      toast.info('WhatsApp Web opened', {
        description: 'Click the video camera icon at the top to start video call',
      });
    }
  };

  const handleVoiceCall = () => {
    const phoneNumber = '7219435156';
    
    // Direct phone call - works on all mobile devices
    window.location.href = `tel:${phoneNumber}`;
    
    toast.success('Initiating voice call...', {
      description: 'Calling ' + phoneNumber,
    });
  };

  const toggleMicrophone = () => {
    const isMuted = videoCallService.current.toggleMicrophone();
    toast.success(isMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  const toggleCamera = () => {
    const isVideoOff = videoCallService.current.toggleCamera();
    toast.success(isVideoOff ? 'Camera turned off' : 'Camera turned on');
  };

  const handleLocationClick = (hospital: Hospital) => {
    // Open Google Maps with directions from current location to hospital
    if (userLocation && hospital.location) {
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${hospital.location.latitude},${hospital.location.longitude}`;
      window.open(url, '_blank');

      toast.success('Opening directions in Google Maps', {
        description: `Directions to ${hospital.name}`,
      });
    } else {
      toast.error('Location not available for directions');
    }
  };

  const shareLocation = async () => {
    if (!userLocation) {
      toast.error('Location not available');
      return;
    }

    try {
      // In a real app, this would share location via SMS or other means
      const shareText = `Emergency - My location: https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Emergency Location',
          text: shareText,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Location copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      toast.error('Failed to share location');
    }
  };

  const filteredHospitals = nearbyHospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Static list of 10 Pune hospitals with doctor information
  const puneHospitals = [
    {
      id: '1',
      name: 'Ruby Hall Clinic',
      type: 'hospital' as const,
      address: '40, Sassoon Road, Pune - 411001',
      phone: '020-66455100',
      beds: 750,
      staff: 250,
      rating: 4.5,
      location: { latitude: 18.5204, longitude: 73.8567 },
      doctors: [
        { name: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', experience: 15, rating: 4.8 },
        { name: 'Dr. Priya Sharma', specialization: 'Neurologist', experience: 12, rating: 4.7 },
        { name: 'Dr. Amit Patel', specialization: 'Orthopedic', experience: 18, rating: 4.9 }
      ]
    },
    {
      id: '2',
      name: 'Jehangir Hospital',
      type: 'hospital' as const,
      address: '32, Sassoon Road, Pune - 411001',
      phone: '020-66811000',
      beds: 350,
      staff: 150,
      rating: 4.3,
      location: { latitude: 18.5206, longitude: 73.8569 },
      doctors: [
        { name: 'Dr. Sneha Reddy', specialization: 'Dermatologist', experience: 10, rating: 4.6 },
        { name: 'Dr. Vikram Singh', specialization: 'General Medicine', experience: 8, rating: 4.4 },
        { name: 'Dr. Kavita Joshi', specialization: 'Pediatrician', experience: 14, rating: 4.7 }
      ]
    },
    {
      id: '3',
      name: 'Sancheti Hospital',
      type: 'specialist' as const,
      address: '16, Shivajinagar, Pune - 411005',
      phone: '020-25533333',
      beds: 200,
      staff: 80,
      rating: 4.6,
      location: { latitude: 18.5212, longitude: 73.8416 },
      doctors: [
        { name: 'Dr. Parag Sancheti', specialization: 'Orthopedic Surgeon', experience: 25, rating: 4.9 },
        { name: 'Dr. Abhay Kulkarni', specialization: 'Spine Specialist', experience: 20, rating: 4.8 },
        { name: 'Dr. Shilpa Sancheti', specialization: 'Joint Replacement', experience: 15, rating: 4.7 }
      ]
    },
    {
      id: '4',
      name: 'Sahyadri Hospital',
      type: 'hospital' as const,
      address: 'Plot No. 30-C, Karve Road, Pune - 411004',
      phone: '020-67213000',
      beds: 400,
      staff: 180,
      rating: 4.4,
      location: { latitude: 18.5095, longitude: 73.8324 },
      doctors: [
        { name: 'Dr. Charudatta Chaudhari', specialization: 'Cardiac Surgeon', experience: 22, rating: 4.8 },
        { name: 'Dr. Mrs. Charudatta Chaudhari', specialization: 'Gynecologist', experience: 18, rating: 4.6 },
        { name: 'Dr. Sameer Jog', specialization: 'Critical Care', experience: 16, rating: 4.7 }
      ]
    },
    {
      id: '5',
      name: 'Aditya Birla Memorial Hospital',
      type: 'hospital' as const,
      address: 'Aditya Birla Hospital Marg, Chinchwad, Pune - 411033',
      phone: '020-30717500',
      beds: 500,
      staff: 200,
      rating: 4.2,
      location: { latitude: 18.6289, longitude: 73.7997 },
      doctors: [
        { name: 'Dr. Mrs. Neeta Deshpande', specialization: 'Endocrinologist', experience: 20, rating: 4.5 },
        { name: 'Dr. Abhijit Deshpande', specialization: 'Gastroenterologist', experience: 18, rating: 4.6 },
        { name: 'Dr. Mrs. Manjiri Deshpande', specialization: 'Rheumatologist', experience: 14, rating: 4.4 }
      ]
    },
    {
      id: '6',
      name: 'Deenanath Mangeshkar Hospital',
      type: 'hospital' as const,
      address: 'Near Mhatre Bridge, Erandwane, Pune - 411004',
      phone: '020-40151000',
      beds: 800,
      staff: 300,
      rating: 4.5,
      location: { latitude: 18.5092, longitude: 73.8321 },
      doctors: [
        { name: 'Dr. Dhananjay Kelkar', specialization: 'Nephrologist', experience: 25, rating: 4.8 },
        { name: 'Dr. Mrs. Sucheta Mudgerikar', specialization: 'Ophthalmologist', experience: 20, rating: 4.7 },
        { name: 'Dr. Sameer Jog', specialization: 'Pulmonologist', experience: 16, rating: 4.6 }
      ]
    },
    {
      id: '7',
      name: 'Poona Hospital & Research Centre',
      type: 'hospital' as const,
      address: '27, Sadashiv Peth, Pune - 411030',
      phone: '020-24331707',
      beds: 300,
      staff: 120,
      rating: 4.1,
      location: { latitude: 18.5123, longitude: 73.8542 },
      doctors: [
        { name: 'Dr. Mrs. Vaishali Deshmukh', specialization: 'ENT Specialist', experience: 15, rating: 4.4 },
        { name: 'Dr. Shirish Deshmukh', specialization: 'General Surgeon', experience: 22, rating: 4.5 },
        { name: 'Dr. Mrs. Priya Deshmukh', specialization: 'Psychiatrist', experience: 12, rating: 4.3 }
      ]
    },
    {
      id: '8',
      name: 'KEM Hospital',
      type: 'hospital' as const,
      address: '489, Rasta Peth, Sardar Moodliar Road, Pune - 411011',
      phone: '020-66037300',
      beds: 550,
      staff: 180,
      rating: 4.0,
      location: { latitude: 18.5148, longitude: 73.8705 },
      doctors: [
        { name: 'Dr. Mrs. Meera Joshi', specialization: 'Internal Medicine', experience: 18, rating: 4.2 },
        { name: 'Dr. Rajendra Joshi', specialization: 'Emergency Medicine', experience: 20, rating: 4.3 },
        { name: 'Dr. Mrs. Anita Joshi', specialization: 'Family Medicine', experience: 16, rating: 4.1 }
      ]
    },
    {
      id: '9',
      name: 'Noble Hospital',
      type: 'hospital' as const,
      address: '153, Magarpatta City, Hadapsar, Pune - 411013',
      phone: '020-66285000',
      beds: 250,
      staff: 100,
      rating: 4.3,
      location: { latitude: 18.5203, longitude: 73.9279 },
      doctors: [
        { name: 'Dr. Mrs. Shilpa Pawar', specialization: 'Obstetrician', experience: 14, rating: 4.5 },
        { name: 'Dr. Suresh Pawar', specialization: 'Urologist', experience: 18, rating: 4.4 },
        { name: 'Dr. Mrs. Kavita Pawar', specialization: 'Anesthesiologist', experience: 12, rating: 4.3 }
      ]
    },
    {
      id: '10',
      name: 'Columbia Asia Hospital',
      type: 'hospital' as const,
      address: '22/2A, Mundhwa - Kharadi Road, Pune - 411014',
      phone: '020-71290202',
      beds: 100,
      staff: 60,
      rating: 4.2,
      location: { latitude: 18.5389, longitude: 73.9312 },
      doctors: [
        { name: 'Dr. Mrs. Rashmi Kumar', specialization: 'Radiologist', experience: 10, rating: 4.3 },
        { name: 'Dr. Amit Kumar', specialization: 'Pathologist', experience: 12, rating: 4.2 },
        { name: 'Dr. Mrs. Neha Kumar', specialization: 'Dietitian', experience: 8, rating: 4.4 }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl mb-4">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">RescueGuard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Emergency assistance, hospital locator, and direct communication with healthcare providers.
          </p>
        </div>

        {/* Location Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {isLoadingLocation ? 'Getting location...' : userLocation ? 'Location found' : 'Location unavailable'}
                </p>
                {userLocation && (
                  <p className="text-sm text-muted-foreground">
                    {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            {!userLocation && !isLoadingLocation && (
              <Button onClick={initializeLocation} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Enable Location
              </Button>
            )}
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
            <TabsTrigger value="call">Video Call</TabsTrigger>
          </TabsList>

          {/* Emergency Tab */}
          <TabsContent value="emergency" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Emergency Services
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { type: 'medical' as const, label: 'Medical', icon: '🏥', color: 'red' },
                  { type: 'ambulance' as const, label: 'Ambulance', icon: '🚑', color: 'red' },
                  { type: 'police' as const, label: 'Police', icon: '👮', color: 'blue' },
                  { type: 'fire' as const, label: 'Fire', icon: '🚒', color: 'orange' },
                ].map(({ type, label, icon, color }) => (
                  <Button
                    key={type}
                    onClick={() => handleEmergencyCall(type)}
                    disabled={isEmergencyCallActive || !userLocation}
                    className={`h-20 flex-col gap-2 bg-${color}-500 hover:bg-${color}-600`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </Button>
                ))}
              </div>

              {userLocation && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={shareLocation}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share My Location
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Hospitals Tab */}
          <TabsContent value="hospitals" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search hospitals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={initializeLocation}
                  disabled={isLoadingLocation}
                  variant="outline"
                >
                  {isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isLoadingHospitals ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  <p className="text-muted-foreground">Finding nearby hospitals...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {puneHospitals
                    .filter(hospital =>
                      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      hospital.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      hospital.address.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((hospital) => (
                    <Card
                      key={hospital.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedHospital(hospital)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <HospitalIcon className="h-5 w-5 text-blue-500" />
                            <h4 className="font-semibold">{hospital.name}</h4>
                            <Badge variant="outline">{hospital.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{hospital.address}</p>

                          {/* Doctor Information */}
                          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-blue-600" />
                              Available Doctors
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {hospital.doctors.map((doctor, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium text-blue-900 dark:text-blue-100">
                                    Dr. {doctor.name}
                                  </span>
                                  <p className="text-muted-foreground">{doctor.specialization}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {doctor.experience} years exp
                                    </Badge>
                                    <span className="text-xs">⭐ {doctor.rating}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>🏥 {hospital.beds} beds</span>
                            <span>👥 {hospital.staff} doctors</span>
                            <span>⭐ {hospital.rating}</span>
                            <span className="text-green-600 font-medium">24/7 Available</span>
                          </div>
                        </div>

                        {/* Call Options */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${hospital.phone}`;
                            }}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Voice Call
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              // For Android: try FaceTime equivalent or WhatsApp
                              const isAndroid = /Android/i.test(navigator.userAgent);
                              if (isAndroid) {
                                window.location.href = `tel:${hospital.phone}`;
                              } else {
                                window.location.href = `facetime:${hospital.phone}`;
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Video Call
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/91${hospital.phone.slice(1)}`, '_blank');
                            }}
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <span className="text-sm">💬</span>
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLocationClick(hospital);
                            }}
                            size="sm"
                            variant="outline"
                            className="border-purple-500 text-purple-600 hover:bg-purple-50"
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Location
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Video Call Tab */}
          <TabsContent value="call" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-green-500" />
                Emergency Video Consultation
              </h3>

              {!isVideoCallActive ? (
                <div className="text-center space-y-6">
                  <div className="max-w-md mx-auto">
                    <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">Ready for Emergency Consultation</h4>
                    <p className="text-muted-foreground mb-6">
                      Connect with healthcare professionals for immediate assistance
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleVideoCall}
                      size="lg"
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Start Video Call
                    </Button>

                    <Button
                      onClick={handleVoiceCall}
                      size="lg"
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Start Voice Call
                    </Button>

                    <Button
                      onClick={() => window.open(`https://wa.me/917219435156`, '_blank')}
                      variant="outline"
                      size="lg"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <span className="text-lg mr-2">💬</span>
                      Open WhatsApp Chat
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📞</span>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Emergency Contact: +91 7219435156
                      </p>
                    </div>
                    <ul className="text-left space-y-1 text-blue-800 dark:text-blue-200">
                      <li>• <strong>Video Call:</strong> iOS uses FaceTime, Android uses default dialer</li>
                      <li>• <strong>Voice Call:</strong> Direct phone call to emergency number</li>
                      <li>• <strong>WhatsApp:</strong> Opens chat for messaging and calls</li>
                      <li>• All options work on mobile and desktop</li>
                      <li>• Available 24/7 for emergencies</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Elements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-48 bg-muted rounded-lg object-cover"
                      />
                      <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                        You
                      </div>
                    </div>
                    <div className="relative">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-48 bg-muted rounded-lg object-cover"
                      />
                      <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                        Doctor
                      </div>
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={toggleMicrophone}
                      variant="outline"
                      size="icon"
                      title="Toggle Microphone"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={toggleCamera}
                      variant="outline"
                      size="icon"
                      title="Toggle Camera"
                    >
                      <VideoIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => window.location.href = 'tel:7219435156'}
                      variant="outline"
                      size="icon"
                      title="Switch to Voice Call"
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={handleVideoCall}
                      variant="destructive"
                      size="icon"
                      title="End Call"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connected to emergency healthcare provider
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Emergency Contact: 7219435156
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Emergency Information */}
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Emergency Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-red-800 dark:text-red-200 mb-2">When to call emergency services:</p>
                <ul className="space-y-1 text-red-700 dark:text-red-300">
                  <li>• Chest pain or difficulty breathing</li>
                  <li>• Severe bleeding or trauma</li>
                  <li>• Loss of consciousness</li>
                  <li>• Sudden severe headache or weakness</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-red-800 dark:text-red-200 mb-2">What information to provide:</p>
                <ul className="space-y-1 text-red-700 dark:text-red-300">
                  <li>• Your exact location</li>
                  <li>• Nature of the emergency</li>
                  <li>• Number of people affected</li>
                  <li>• Your contact information</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RescueGuard;
