"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScanLine, Camera, UserCheck, UserX, Info, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function OICScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error' | 'info'; message: string; studentInfo?: {name: string, department: string, club?: string} } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();
  const { allUsers } = useAuth();

  useEffect(() => {
    if (isScanning) {
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        console.error("QR reader element not found!");
        setScanResult({ type: 'error', message: 'Scanner UI element could not be initialized. Please refresh the page.' });
        setIsScanning(false);
        setHasCameraPermission(false);
        return;
      }

      const localScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        false // verbose = false
      );
      scannerRef.current = localScanner;

      const onScanSuccess = (decodedText: string) => {
        setScannedData(decodedText);
        const studentProfile = allUsers.find(u => u.role === 'student' && u.qrCodeID === decodedText);

        if (studentProfile) {
          const scanType = Math.random() > 0.5 ? 'IN' : 'OUT'; // Simple random for demo
          setScanResult({ 
            type: 'success', 
            message: `Scanned ${scanType}: ${studentProfile.fullName}`, 
            studentInfo: { 
              name: studentProfile.fullName, 
              department: studentProfile.departmentID || 'N/A', 
              club: studentProfile.clubID 
            }
          });
          toast({ title: "Scan Successful", description: `${studentProfile.fullName} scanned ${scanType}.` });
        } else {
          setScanResult({ type: 'error', message: 'Invalid QR Code. Student not found in system.' });
          toast({ title: "Scan Failed", description: "Student QR code not recognized.", variant: "destructive" });
        }
      };

      const onScanFailure = (errorMessage: string) => {
        console.log(`QR Scan Error: ${errorMessage}`);
        const lowerError = errorMessage.toLowerCase();
        if (
          lowerError.includes("permission denied") ||
          lowerError.includes("notallowederror") ||
          lowerError.includes("camera not found") ||
          lowerError.includes("no cameras found") ||
          lowerError.includes("requested device not found") ||
          lowerError.includes("notreadableerror")
        ) {
          setHasCameraPermission(false);
          setScanResult({ type: 'error', message: `Camera access error: ${errorMessage}. Please check permissions and ensure your camera is not in use by another application.` });
          setIsScanning(false); // Stop scanning attempts if critical camera error
        }
      };

      try {
        localScanner.render(onScanSuccess, onScanFailure);
        setHasCameraPermission(null); // Initially unknown, will be updated by onScanFailure if needed
      } catch (error: any) {
        console.error("Failed to initialize or render QR Scanner:", error);
        setHasCameraPermission(false);
        setScanResult({ type: 'error', message: `Error initializing scanner: ${error.message || 'Unknown error'}. Ensure your browser supports the necessary features and camera is available.` });
        setIsScanning(false);
      }

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => {
            console.error("Error clearing scanner:", err);
          });
          scannerRef.current = null;
        }
      };
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error("Error clearing scanner (isScanning false):", err);
        });
        scannerRef.current = null;
      }
      setHasCameraPermission(null); // Reset permission state when not scanning
    }
  }, [isScanning, allUsers, toast]);

  const handleScanStart = () => {
    setScanResult(null);
    setScannedData(null);
    setIsScanning(true); 
  };

  const handleScanStop = () => {
    setIsScanning(false); 
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
          
          {isScanning && (
            <div className="my-6">
              <div className="w-full max-w-md mx-auto aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden">
                <div id="qr-reader" className="w-full"></div>
              </div>
              <Button onClick={handleScanStop} variant="outline" className="mt-4">
                Cancel Scan
              </Button>
            </div>
          )}

          {hasCameraPermission === false && (
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

          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground text-left">
              <li>Click "Start Scanning" to activate the camera.</li>
              <li>Allow camera permission when prompted.</li>
              <li>Position the student's QR code within the camera view.</li>
              <li>The system will automatically detect and process valid QR codes.</li>
              <li>Scan result will be displayed above.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
