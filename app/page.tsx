'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';

// Map Preview Component - small preview for table rows
const MapPreview = dynamic(
  () => {
    return Promise.resolve().then(() => {
      const React = require('react');
      const L = require('leaflet');
      const { MapContainer, TileLayer, GeoJSON, useMap } = require('react-leaflet');

      // Fix for default marker icons in Next.js
      if (typeof window !== 'undefined') {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      }

      const FitBounds = ({ geoJsonData }: { geoJsonData: any }) => {
        const map = useMap();
        React.useEffect(() => {
          if (geoJsonData && map) {
            try {
              const geoJsonLayer = L.geoJSON(geoJsonData as any);
              const bounds = geoJsonLayer.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [5, 5] });
              }
            } catch (err) {
              // Silently fail for preview
            }
          }
        }, [geoJsonData, map]);
        return null;
      };

      return ({ logId, apiBaseUrl, onMapClick }: { logId: number; apiBaseUrl: string; onMapClick?: (logId: number) => void }) => {
      const [geoJsonData, setGeoJsonData] = React.useState<any>(null);
      const [loading, setLoading] = React.useState(true);
      const [mounted, setMounted] = React.useState(false);
      const [containerReady, setContainerReady] = React.useState(false);

      React.useEffect(() => {
        // Use a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          setMounted(true);
        }, 100);
        return () => clearTimeout(timer);
      }, []);

      // Check if container is ready after mount
      React.useEffect(() => {
        if (mounted) {
          // Additional small delay to ensure container is in DOM
          const timer = setTimeout(() => {
            setContainerReady(true);
          }, 50);
          return () => clearTimeout(timer);
        }
      }, [mounted]);

      React.useEffect(() => {
        if (!mounted) return;
        
        let cancelled = false;
        const fetchGeoJson = async () => {
          try {
            const response = await fetch(`${apiBaseUrl}/mcap-logs/${logId}/geojson`);
            if (!response.ok) {
              throw new Error('Failed to fetch');
            }
            const data = await response.json();
            if (!cancelled) {
              setGeoJsonData(data);
            }
          } catch (err) {
            // Silently fail for preview
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        };

        fetchGeoJson();
        return () => {
          cancelled = true;
        };
      }, [logId, apiBaseUrl, mounted]);

      const geoJsonStyle = {
        color: '#3388ff',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.2,
      };

      const pointToLayer = (feature: any, latlng: L.LatLng) => {
        return L.circleMarker(latlng, {
          radius: 3,
          fillColor: '#3388ff',
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        });
      };

      // Calculate center from GeoJSON if available
      let center: [number, number] = [0, 0];
      if (geoJsonData?.features?.[0]?.geometry?.coordinates) {
        const coords = geoJsonData.features[0].geometry.coordinates;
        if (geoJsonData.features[0].geometry.type === 'Point') {
          center = [coords[1], coords[0]];
        } else if (geoJsonData.features[0].geometry.type === 'LineString' && coords.length > 0) {
          center = [coords[0][1], coords[0][0]];
        }
      }

      if (!mounted) {
        return (
          <div className="w-full h-24 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
            <span className="text-xs text-zinc-500">Loading...</span>
          </div>
        );
      }

      if (loading) {
        return (
          <div className="w-full h-24 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
            <span className="text-xs text-zinc-500">Loading...</span>
          </div>
        );
      }

      if (!geoJsonData) {
        return (
          <div className="w-full h-24 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
            <span className="text-xs text-zinc-500">No map data</span>
          </div>
        );
      }

      return (
        <div 
          className="w-full h-24 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => onMapClick?.(logId)}
          title="Click to view full map"
        >
          {mounted && containerReady ? (
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={false}
              zoomControl={false}
              dragging={false}
              doubleClickZoom={false}
              boxZoom={false}
              touchZoom={false}
              key={`map-${logId}-${mounted}`}
            >
              <TileLayer
                attribution=""
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON
                data={geoJsonData}
                style={geoJsonStyle}
                pointToLayer={pointToLayer}
              />
              <FitBounds geoJsonData={geoJsonData} />
            </MapContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-zinc-500">Loading map...</span>
            </div>
          )}
        </div>
      );
      };
    });
  },
  { ssr: false }
);

// Map Component - dynamically imported to avoid SSR issues
const MapComponent = dynamic(
  () => {
    return Promise.resolve().then(() => {
      const React = require('react');
      const L = require('leaflet');
      const { MapContainer, TileLayer, GeoJSON, useMap } = require('react-leaflet');

      // Fix for default marker icons in Next.js
      if (typeof window !== 'undefined') {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      }

      const FitBounds = ({ geoJsonData }: { geoJsonData: any }) => {
        const map = useMap();
        React.useEffect(() => {
          if (geoJsonData && map) {
            try {
              const geoJsonLayer = L.geoJSON(geoJsonData as any);
              const bounds = geoJsonLayer.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20] });
              }
            } catch (err) {
              console.error('Error fitting bounds:', err);
            }
          }
        }, [geoJsonData, map]);
        return null;
      };

      return ({ geoJsonData }: { geoJsonData: any }) => {
        const [mounted, setMounted] = React.useState(false);

        React.useEffect(() => {
          setMounted(true);
        }, []);

        const geoJsonStyle = {
          color: '#3388ff',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.2,
        };

        const pointToLayer = (feature: any, latlng: L.LatLng) => {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#3388ff',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          });
        };

        const onEachFeature = (feature: any, layer: L.Layer) => {
          if (feature.properties) {
            const popupContent = Object.keys(feature.properties)
              .map((key) => `<strong>${key}:</strong> ${feature.properties[key]}`)
              .join('<br>');
            layer.bindPopup(popupContent);
          }
        };

        // Calculate center from GeoJSON if available
        let center: [number, number] = [0, 0];
        if (geoJsonData?.features?.[0]?.geometry?.coordinates) {
          const coords = geoJsonData.features[0].geometry.coordinates;
          if (geoJsonData.features[0].geometry.type === 'Point') {
            center = [coords[1], coords[0]];
          } else if (geoJsonData.features[0].geometry.type === 'LineString' && coords.length > 0) {
            center = [coords[0][1], coords[0][0]];
          }
        }

        if (!mounted) {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-zinc-500">Loading map...</span>
            </div>
          );
        }

        return (
          <div className="w-full h-full">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
              key={`fullmap-${mounted}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geoJsonData && (
                <GeoJSON
                  data={geoJsonData}
                  style={geoJsonStyle}
                  pointToLayer={pointToLayer}
                  onEachFeature={onEachFeature}
                />
              )}
              <FitBounds geoJsonData={geoJsonData} />
            </MapContainer>
          </div>
        );
      };
    });
  },
  { ssr: false }
);

interface McapLog {
  id: number;
  recovery_status?: string;
  parse_status?: string;
  captured_at?: string;
  duration_seconds?: number;
  channel_count?: number;
  channels?: string[];
  channels_summary?: string[];
  rough_point?: string;
  car?: string | { id: number; name: string };
  driver?: string | { id: number; name: string };
  event_type?: string | { id: number; name: string };
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function Home() {
  const [logs, setLogs] = useState<McapLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLog, setSelectedLog] = useState<McapLog | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    car: '',
    driver: '',
    event_type: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loadingGeoJson, setLoadingGeoJson] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);
  const [cars, setCars] = useState<{ id: number; name: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: number; name: string }[]>([]);
  const [eventTypes, setEventTypes] = useState<{ id: number; name: string }[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Fetch cars, drivers, and event types for dropdowns
  const fetchLookups = async () => {
    setLoadingLookups(true);
    try {
      // Fetch cars
      try {
        const carsResponse = await fetch(`${API_BASE_URL}/cars/`);
        if (carsResponse.ok) {
          const carsData = await carsResponse.json();
          setCars(Array.isArray(carsData) ? carsData : []);
        }
      } catch (err) {
        console.warn('Failed to fetch cars:', err);
      }

      // Fetch drivers
      try {
        const driversResponse = await fetch(`${API_BASE_URL}/drivers/`);
        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(Array.isArray(driversData) ? driversData : []);
        }
      } catch (err) {
        console.warn('Failed to fetch drivers:', err);
      }

      // Fetch event types
      try {
        const eventTypesResponse = await fetch(`${API_BASE_URL}/event-types/`);
        if (eventTypesResponse.ok) {
          const eventTypesData = await eventTypesResponse.json();
          setEventTypes(Array.isArray(eventTypesData) ? eventTypesData : []);
        }
      } catch (err) {
        console.warn('Failed to fetch event types:', err);
      }
    } catch (err) {
      console.error('Error fetching lookups:', err);
    } finally {
      setLoadingLookups(false);
    }
  };

  // Fetch logs from the API
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mcap-logs/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/mcap-logs/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || `Upload failed: ${response.statusText}`
        );
      }

      // Clear selected file and refresh logs
      setSelectedFile(null);
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.mcap')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a .mcap file');
        setSelectedFile(null);
      }
    }
  };

  // Fetch a specific log by ID
  const fetchLog = async (id: number) => {
    setLoadingLog(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mcap-logs/${id}/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch log: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch log');
      console.error('Error fetching log:', err);
      throw err;
    } finally {
      setLoadingLog(false);
    }
  };

  // View log details
  const handleViewLog = async (id: number) => {
    try {
      const log = await fetchLog(id);
      setSelectedLog(log);
      setIsViewModalOpen(true);
    } catch (err) {
      // Error already handled in fetchLog
    }
  };

  // Helper to extract name from car/driver/event_type (handles both object and string)
  const getName = (value: string | { id: number; name: string } | undefined): string => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && 'name' in value) return value.name;
    return 'N/A';
  };

  // Helper to extract ID from car/driver/event_type (handles both object and string)
  const extractId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'object' && value.id) return value.id.toString();
    if (typeof value === 'string') {
      // If it's a string, try to find matching ID from lookups
      const carMatch = cars.find(c => c.name === value);
      if (carMatch) return carMatch.id.toString();
      const driverMatch = drivers.find(d => d.name === value);
      if (driverMatch) return driverMatch.id.toString();
      const eventMatch = eventTypes.find(e => e.name === value);
      if (eventMatch) return eventMatch.id.toString();
    }
    return '';
  };

  // Open edit modal
  const handleEditLog = async (id: number) => {
    try {
      const log = await fetchLog(id);
      setSelectedLog(log);
      setEditForm({
        car: extractId(log.car),
        driver: extractId(log.driver),
        event_type: extractId(log.event_type),
        notes: log.notes || '',
      });
      setIsEditModalOpen(true);
    } catch (err) {
      // Error already handled in fetchLog
    }
  };

  // Update log (PATCH or PUT)
  const handleUpdateLog = async (id: number, usePut = false) => {
    setSaving(true);
    setError(null);

    try {
      const method = usePut ? 'PUT' : 'PATCH';
      
      // Build request body - convert IDs to numbers for car, driver, event_type
      const body = {
        car: editForm.car ? Number(editForm.car) : null,
        driver: editForm.driver ? Number(editForm.driver) : null,
        event_type: editForm.event_type ? Number(editForm.event_type) : null,
        notes: editForm.notes || '',
      };

      const response = await fetch(`${API_BASE_URL}/mcap-logs/${id}/`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = `Update failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          // Handle different error response formats
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'object') {
            // Handle field-specific errors
            const fieldErrors = Object.entries(errorData)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, use the status text
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      setIsEditModalOpen(false);
      setSelectedLog(null);
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update log');
      console.error('Error updating log:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete log
  const handleDeleteLog = async (id: number) => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/mcap-logs/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || `Delete failed: ${response.statusText}`
        );
      }

      setIsDeleteModalOpen(false);
      setLogToDelete(null);
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete log');
      console.error('Error deleting log:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (id: number) => {
    setLogToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Fetch GeoJSON for a log
  const fetchGeoJson = async (id: number) => {
    setLoadingGeoJson(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mcap-logs/${id}/geojson`);
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
      }
      const data = await response.json();
      setGeoJsonData(data);
      setIsMapModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GeoJSON');
      console.error('Error fetching GeoJSON:', err);
    } finally {
      setLoadingGeoJson(false);
    }
  };

  // Download MCAP file
  const handleDownload = async (id: number) => {
    setDownloading(id);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mcap-logs/${id}/download`);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `mcap-log-${id}.mcap`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
      console.error('Error downloading file:', err);
    } finally {
      setDownloading(null);
    }
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      log.id.toString().includes(query) ||
      getName(log.car).toLowerCase().includes(query) ||
      getName(log.driver).toLowerCase().includes(query) ||
      getName(log.event_type).toLowerCase().includes(query) ||
      (log.notes && log.notes.toLowerCase().includes(query)) ||
      (log.recovery_status && log.recovery_status.toLowerCase().includes(query)) ||
      (log.parse_status && log.parse_status.toLowerCase().includes(query)) ||
      (log.captured_at && new Date(log.captured_at).toLocaleString().toLowerCase().includes(query))
    );
  });

  // Fetch logs and lookups on component mount
  useEffect(() => {
    fetchLookups();
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-8 px-4 sm:px-8 relative overflow-hidden">
      {/* Animated background elements for glassmorphism effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-8 drop-shadow-lg">
          MCAP Log Manager
        </h1>

        {/* Upload Section */}
        <Card glass className="mb-8">
          <CardHeader>
            <CardTitle>Upload MCAP File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".mcap"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <Button variant="glass" className="cursor-pointer" asChild>
                  <span>Select MCAP File</span>
                </Button>
              </label>

              {selectedFile && (
                <div className="flex-1">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Selected: <span className="font-medium text-black dark:text-zinc-50">{selectedFile.name}</span>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                variant="default"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 glass-card border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs Display Section */}
        <Card glass>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>MCAP Logs</CardTitle>
              <Button
                onClick={fetchLogs}
                disabled={loading}
                variant="glass"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search logs by ID, car, driver, event type, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  glass
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>

          {loading && logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400">
                {searchQuery ? `No logs found matching "${searchQuery}"` : 'No logs found. Upload a file to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Map Preview</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Captured At</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Channels</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Car</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Driver</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Event</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-zinc-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{log.id}</td>
                      <td className="py-3 px-4">
                        <MapPreview 
                          logId={log.id} 
                          apiBaseUrl={API_BASE_URL} 
                          onMapClick={fetchGeoJson}
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {log.captured_at
                          ? new Date(log.captured_at).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {log.duration_seconds
                          ? `${log.duration_seconds.toFixed(1)}s`
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {log.channel_count ?? 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex flex-col gap-1">
                          {log.recovery_status && (
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs ${
                                log.recovery_status === 'success'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                            >
                              Recovery: {log.recovery_status}
                            </span>
                          )}
                          {log.parse_status && (
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs ${
                                log.parse_status === 'success'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                            >
                              Parse: {log.parse_status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {getName(log.car)}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {getName(log.driver)}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {getName(log.event_type)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            onClick={() => handleViewLog(log.id)}
                            variant="default"
                            size="sm"
                            className="text-xs"
                          >
                            View
                          </Button>
                          <Button
                            onClick={() => fetchGeoJson(log.id)}
                            disabled={loadingGeoJson}
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                          >
                            Map
                          </Button>
                          <Button
                            onClick={() => handleDownload(log.id)}
                            disabled={downloading === log.id}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            title="Download MCAP file"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {downloading === log.id ? 'Downloading...' : 'Download'}
                          </Button>
                          <Button
                            onClick={() => handleEditLog(log.id)}
                            variant="default"
                            size="sm"
                            className="text-xs bg-green-500 hover:bg-green-600"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => openDeleteConfirm(log.id)}
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </CardContent>
        </Card>

        {/* View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setSelectedLog(null);
        }}>
          {selectedLog && (
            <DialogContent glass className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Details - ID: {selectedLog.id}</DialogTitle>
              </DialogHeader>
                {loadingLog ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-600 dark:text-zinc-400">Loading log details...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Recovery Status</label>
                        <p className="text-black dark:text-zinc-50">{selectedLog.recovery_status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Parse Status</label>
                        <p className="text-black dark:text-zinc-50">{selectedLog.parse_status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Captured At</label>
                        <p className="text-black dark:text-zinc-50">
                          {selectedLog.captured_at ? new Date(selectedLog.captured_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Duration</label>
                        <p className="text-black dark:text-zinc-50">
                          {selectedLog.duration_seconds ? `${selectedLog.duration_seconds.toFixed(1)}s` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Channel Count</label>
                        <p className="text-black dark:text-zinc-50">{selectedLog.channel_count ?? 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Rough Point</label>
                        <p className="text-black dark:text-zinc-50">{selectedLog.rough_point || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Car</label>
                        <p className="text-black dark:text-zinc-50">{getName(selectedLog.car)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Driver</label>
                        <p className="text-black dark:text-zinc-50">{getName(selectedLog.driver)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Event Type</label>
                        <p className="text-black dark:text-zinc-50">{getName(selectedLog.event_type)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Created At</label>
                        <p className="text-black dark:text-zinc-50">
                          {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Updated At</label>
                        <p className="text-black dark:text-zinc-50">
                          {selectedLog.updated_at ? new Date(selectedLog.updated_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedLog.channels && selectedLog.channels.length > 0 && (
                      <div className="glass-card p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                            Channels
                          </label>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            Count: {selectedLog.channel_count ?? selectedLog.channels.length}
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <table className="w-full border-collapse">
                            <thead className="sticky top-0 glass-button">
                              <tr>
                                <th className="text-left py-2 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                                  #
                                </th>
                                <th className="text-left py-2 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                                  Channel Name
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedLog.channels.map((channel, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                  <td className="py-2 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2 px-4 text-sm text-zinc-800 dark:text-zinc-200 font-mono">
                                    {channel}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {selectedLog.notes && (
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Notes</label>
                        <p className="text-black dark:text-zinc-50 mt-1">{selectedLog.notes}</p>
                      </div>
                    )}
                    <div className="pt-4">
                      <Button
                        onClick={() => fetchGeoJson(selectedLog.id)}
                        disabled={loadingGeoJson}
                        className="w-full"
                        variant="secondary"
                      >
                        {loadingGeoJson ? 'Loading Map...' : 'View on Map'}
                      </Button>
                    </div>
                  </div>
                )}
            </DialogContent>
          )}
        </Dialog>

        {/* Map Modal */}
        <Dialog open={isMapModalOpen} onOpenChange={(open) => {
          setIsMapModalOpen(open);
          if (!open) setGeoJsonData(null);
        }}>
          {geoJsonData && (
            <DialogContent glass className="max-w-6xl w-full h-[90vh] flex flex-col p-0">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                <DialogTitle>Map View - Log ID: {selectedLog?.id}</DialogTitle>
              </div>
              <div className="flex-1 relative">
                <MapComponent geoJsonData={geoJsonData} />
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedLog(null);
        }}>
          {selectedLog && (
            <DialogContent glass className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Log - ID: {selectedLog.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="car">Car</Label>
                    {editForm.car && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setEditForm({ ...editForm, car: '' })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {loadingLookups ? (
                    <Input
                      id="car"
                      type="text"
                      value="Loading..."
                      disabled
                      glass
                    />
                  ) : (
                    <Select
                      value={editForm.car || undefined}
                      onValueChange={(value) => setEditForm({ ...editForm, car: value })}
                    >
                      <SelectTrigger id="car" className="glass-input backdrop-blur-md border-opacity-20 bg-opacity-10">
                        <SelectValue placeholder="Select a car" />
                      </SelectTrigger>
                      <SelectContent className="glass-card backdrop-blur-md">
                        {cars.map((car) => (
                          <SelectItem key={car.id} value={car.id.toString()}>
                            {car.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="driver">Driver</Label>
                    {editForm.driver && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setEditForm({ ...editForm, driver: '' })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {loadingLookups ? (
                    <Input
                      id="driver"
                      type="text"
                      value="Loading..."
                      disabled
                      glass
                    />
                  ) : (
                    <Select
                      value={editForm.driver || undefined}
                      onValueChange={(value) => setEditForm({ ...editForm, driver: value })}
                    >
                      <SelectTrigger id="driver" className="glass-input backdrop-blur-md border-opacity-20 bg-opacity-10">
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent className="glass-card backdrop-blur-md">
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="event_type">Event Type</Label>
                    {editForm.event_type && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setEditForm({ ...editForm, event_type: '' })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {loadingLookups ? (
                    <Input
                      id="event_type"
                      type="text"
                      value="Loading..."
                      disabled
                      glass
                    />
                  ) : (
                    <Select
                      value={editForm.event_type || undefined}
                      onValueChange={(value) => setEditForm({ ...editForm, event_type: value })}
                    >
                      <SelectTrigger id="event_type" className="glass-input backdrop-blur-md border-opacity-20 bg-opacity-10">
                        <SelectValue placeholder="Select an event type" />
                      </SelectTrigger>
                      <SelectContent className="glass-card backdrop-blur-md">
                        {eventTypes.map((eventType) => (
                          <SelectItem key={eventType.id} value={eventType.id.toString()}>
                            {eventType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={4}
                    glass
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => handleUpdateLog(selectedLog.id, false)}
                    disabled={saving}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? 'Saving...' : 'Update (PATCH)'}
                  </Button>
                  <Button
                    onClick={() => handleUpdateLog(selectedLog.id, true)}
                    disabled={saving}
                    variant="default"
                  >
                    {saving ? 'Saving...' : 'Update (PUT)'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedLog(null);
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) setLogToDelete(null);
        }}>
          {logToDelete !== null && (
            <DialogContent glass className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete log ID {logToDelete}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => handleDeleteLog(logToDelete)}
                  disabled={deleting}
                  variant="destructive"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setLogToDelete(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
        </div>
    </div>
  );
}
