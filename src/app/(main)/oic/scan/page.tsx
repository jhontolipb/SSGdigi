
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScanLine, Camera, UserCheck, UserX, Info, CheckCircle, XCircle } from "lucide-react";
import Image from 'next/image';

// Mock student data for scanner simulation
const mockStudentDatabase: Record<string, { name: string; department: string; club?: string; lastScanStatus?: 'in' | 'out' }> = {
  'qr-student123': { name: 'John Doe', department: 'BS Information Technology', club: 'Robotics Club' },
  'qr-student456': { name: 'Jane Smith', department: 'BS Tourism Management' },
  'qr-valid-in': { name: 'Alice Wonderland', department: 'BS Criminology', lastScanStatus: 'in' },
};


export default function OICScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error' | 'info'; message: string; student?: any } | null>(null);
  const [showCameraPlaceholder, setShowCameraPlaceholder] = useState(false);

  const handleScanStart = () => {
    setIsScanning(true);
    setShowCameraPlaceholder(true);
    setScanResult(null);
    setScannedData(null);
    // In a real app, initialize camera here
    // For demo, simulate a scan after a delay
    setTimeout(() => {
        // Simulate scanning one of the mock QR codes
        const mockQrCodes = Object.keys(mockStudentDatabase);
        const randomQr = mockQrCodes[Math.floor(Math.random() * mockQrCodes.length)];
        handleQrCodeScanned(randomQr);
    }, 3000);
  };
  
  const handleScanStop = () => {
    setIsScanning(false);
    setShowCameraPlaceholder(false);
    // In a real app, stop camera here
  };

  const handleQrCodeScanned = (data: string) => {
    setShowCameraPlaceholder(false); // Hide camera view after "scan"
    setIsScanning(false);
    setScannedData(data);
    const studentInfo = mockStudentDatabase[data];

    if (studentInfo) {
      // Simulate Time In / Time Out logic
      if (studentInfo.lastScanStatus === 'in') {
        mockStudentDatabase[data].lastScanStatus = 'out';
        setScanResult({ 
            type: 'success', 
            message: `Scanned OUT: ${studentInfo.name}`, 
            student: studentInfo 
        });
      } else {
        mockStudentDatabase[data].lastScanStatus = 'in';
         setScanResult({ 
            type: 'success', 
            message: `Scanned IN: ${studentInfo.name}`, 
            student: studentInfo 
        });
      }
    } else {
      setScanResult({ type: 'error', message: 'Invalid QR Code. Student not found.' });
    }
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
          {!isScanning && !showCameraPlaceholder && (
            <Button onClick={handleScanStart} size="lg" className="bg-primary hover:bg-primary/90">
              <Camera className="mr-2 h-5 w-5" /> Start Scanning
            </Button>
          )}
          
          {showCameraPlaceholder && (
            <div className="my-6">
                <div className="w-full max-w-md mx-auto aspect-square bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-primary/50">
                    <Camera size={64} className="text-primary/70 mb-4" />
                    <p className="text-muted-foreground">Camera feed would appear here.</p>
                    <p className="text-sm text-primary animate-pulse">Simulating scan...</p>
                </div>
                 <Button onClick={handleScanStop} variant="outline" className="mt-4">
                    Cancel Scan
                </Button>
            </div>
          )}

          {scanResult && (
            <Alert className={`mt-6 text-left ${scanResult.type === 'success' ? 'border-green-500' : scanResult.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}>
              {scanResult.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {scanResult.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {scanResult.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
              <AlertTitle className={`font-semibold ${scanResult.type === 'success' ? 'text-green-700' : scanResult.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
                {scanResult.type.toUpperCase()}
              </AlertTitle>
              <AlertDescription>
                {scanResult.message}
                {scanResult.student && (
                  <div className="mt-2 text-sm p-3 bg-muted/50 rounded-md">
                    <p><strong>Name:</strong> {scanResult.student.name}</p>
                    <p><strong>Department:</strong> {scanResult.student.department}</p>
                    {scanResult.student.club && <p><strong>Club:</strong> {scanResult.student.club}</p>}
                    <p><strong>Scanned Data:</strong> {scannedData}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-8 p-4 border rounded-lg bg-background">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground text-left">
                <li>Click "Start Scanning" to activate the camera (simulation).</li>
                <li>Position the student's QR code within the frame.</li>
                <li>The system will automatically attempt to read the QR code.</li>
                <li>Scan result will be displayed above. First scan is Time-In, second scan for same student is Time-Out.</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

