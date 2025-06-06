
"use client";

import { useState, useEffect, useRef } from 'react'; // Added useEffect, useRef
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScanLine, Camera, UserCheck, UserX, Info, CheckCircle, XCircle } from "lucide-react";
// import Image from 'next/image'; // Image component not used currently
import { useToast } from '@/hooks/use-toast'; // Added useToast
import { useAuth } from '@/contexts/AuthContext'; // To potentially fetch student data

// No mock student database here, data will be simulated or 'not found'
// const mockStudentDatabase: Record<string, { name: string; department: string; club?: string; lastScanStatus?: 'in' | 'out' }> = {};

export default function OICScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error' | 'info'; message: string; studentInfo?: {name: string, department: string, club?: string} } | null>(null);
  const [showCameraPlaceholder, setShowCameraPlaceholder] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null); // For camera stream
  const { toast } = useToast();
  const { allUsers } = useAuth(); // To get student data by QR ID

  // State for camera permission
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    if (isScanning && hasCameraPermission) {
      // Placeholder: In a real app, you'd integrate a QR scanning library here
      // that uses the videoRef.current stream.
      // For demo, simulate a scan after a delay if camera is "active"
      const timer = setTimeout(() => {
        if (isScanning) { // Check again in case scanning was stopped
            // Simulate a scan - this would come from the QR library
            const simulatedScannedQr = `qr_user${Math.floor(Math.random() * 1000)}`;
            handleQrCodeScanned(simulatedScannedQr);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, hasCameraPermission]);
  
  // Stop scanning and release camera when component unmounts or isScanning becomes false
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);


  const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Camera access is not supported by your browser.' });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        let description = 'Please enable camera permissions in your browser settings.';
        if (error instanceof Error && error.name === "NotAllowedError") {
            description = "Camera access was denied. Please allow camera access in your browser settings.";
        } else if (error instanceof Error && error.name === "NotFoundError") {
            description = "No camera found. Please ensure a camera is connected and enabled.";
        }
        toast({ variant: 'destructive', title: 'Camera Access Denied', description });
      }
    };


  const handleScanStart = async () => {
    setScanResult(null);
    setScannedData(null);
    setShowCameraPlaceholder(true); // Show placeholder while asking for permission
    await getCameraPermission(); // Request permission
    // If permission granted, isScanning will be set, and useEffect will handle stream
    if (hasCameraPermission === null || hasCameraPermission) { // If null, means still attempting
         setIsScanning(true);
    } else {
        setShowCameraPlaceholder(false); // Hide if permission was explicitly denied
    }
  };
  
  const handleScanStop = () => {
    setIsScanning(false);
    setShowCameraPlaceholder(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleQrCodeScanned = (data: string) => {
    // No camera placeholder anymore if we got data
    // setIsScanning(false); // Keep scanning or stop based on library behavior. For demo, stop.
    // handleScanStop(); // Stop camera after a scan for demo

    setScannedData(data);
    const studentProfile = allUsers.find(u => u.role === 'student' && u.qrCodeID === data);

    if (studentProfile) {
        // Simulate Time In / Time Out logic - This would need persistent storage
        const scanType = Math.random() > 0.5 ? 'IN' : 'OUT'; // Simple random for demo
        setScanResult({ 
            type: 'success', 
            message: `Scanned ${scanType}: ${studentProfile.fullName}`, 
            studentInfo: { name: studentProfile.fullName, department: studentProfile.departmentID || 'N/A', club: studentProfile.clubID }
        });
        toast({ title: "Scan Successful", description: `${studentProfile.fullName} scanned ${scanType}.` });
    } else {
      setScanResult({ type: 'error', message: 'Invalid QR Code. Student not found in system.' });
      toast({ title: "Scan Failed", description: "Student QR code not recognized.", variant: "destructive" });
    }
    // For continuous scanning, don't call handleScanStop here.
    // For single scan, call handleScanStop()
     handleScanStop(); 
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <ScanLine className="text-primary h-7 w-7" /> QR Code Scanner
          </CardTitle>
          <CardDescription>Scan student QR codes for event attendance.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {!isScanning && (
            <Button onClick={handleScanStart} size="lg" className="bg-primary hover:bg-primary/90">
              <Camera className="mr-2 h-5 w-5" /> Start Scanning
            </Button>
          )}
          
          {(isScanning || showCameraPlaceholder) && (
            <div className="my-6">
                <div className="w-full max-w-md mx-auto aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    {isScanning && !videoRef.current?.srcObject && hasCameraPermission === null && (
                         <p className="text-primary animate-pulse p-4">Requesting camera access...</p>
                    )}
                </div>
                 <Button onClick={handleScanStop} variant="outline" className="mt-4">
                    Cancel Scan
                </Button>
            </div>
          )}

            {hasCameraPermission === false && !isScanning && (
                 <Alert variant="destructive" className="mt-4 max-w-md mx-auto">
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                        Camera access is required to scan QR codes. Please enable camera permissions in your browser settings and try again.
                    </AlertDescription>
                </Alert>
            )}


          {scanResult && (
            <Alert className={`mt-6 text-left max-w-md mx-auto ${scanResult.type === 'success' ? 'border-green-500' : scanResult.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}>
              {scanResult.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {scanResult.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {scanResult.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
              <AlertTitle className={`font-semibold ${scanResult.type === 'success' ? 'text-green-700' : scanResult.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
                {scanResult.type.toUpperCase()}
              </AlertTitle>
              <AlertDescription>
                {scanResult.message}
                {scanResult.studentInfo && (
                  <div className="mt-2 text-sm p-3 bg-muted/50 rounded-md">
                    <p><strong>Name:</strong> {scanResult.studentInfo.name}</p>
                    <p><strong>Department:</strong> {scanResult.studentInfo.department}</p>
                    {scanResult.studentInfo.club && <p><strong>Club:</strong> {scanResult.studentInfo.club}</p>}
                    <p><strong>Scanned Data:</strong> {scannedData}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-8 p-4 border rounded-lg bg-background max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground text-left">
                <li>Click "Start Scanning" to activate the camera.</li>
                <li>Allow camera permission when prompted.</li>
                <li>Position the student's QR code within the camera view.</li>
                <li>The system will attempt to read the QR code (simulated).</li>
                <li>Scan result will be displayed above.</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
