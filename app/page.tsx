'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

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

      React.useEffect(() => {
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
      }, [logId, apiBaseUrl]);

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

        return (
          <div className="w-full h-full">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
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
  channels_summary?: string[];
  rough_point?: string;
  car?: string;
  driver?: string;
  event_type?: string;
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

  // Open edit modal
  const handleEditLog = async (id: number) => {
    try {
      const log = await fetchLog(id);
      setSelectedLog(log);
      setEditForm({
        car: log.car || '',
        driver: log.driver || '',
        event_type: log.event_type || '',
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
      const body = usePut
        ? {
            ...selectedLog,
            ...editForm,
          }
        : editForm;

      const response = await fetch(`${API_BASE_URL}/mcap-logs/${id}/`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || `Update failed: ${response.statusText}`
        );
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

  // Fetch logs on component mount
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-8">
          MCAP Log Manager
        </h1>

        {/* Upload Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Upload MCAP File
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="flex items-center justify-center px-6 py-3 bg-foreground text-background rounded-lg cursor-pointer hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors">
              <input
                type="file"
                accept=".mcap"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <span>Select MCAP File</span>
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

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Logs Display Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
              MCAP Logs
            </h2>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading && logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400">No logs found. Upload a file to get started.</p>
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
                  {logs.map((log) => (
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
                        {log.car || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {log.driver || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {log.event_type || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewLog(log.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                          >
                            View
                          </button>
                          <button
                            onClick={() => fetchGeoJson(log.id)}
                            disabled={loadingGeoJson}
                            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors text-xs"
                          >
                            Map
                          </button>
                          <button
                            onClick={() => handleEditLog(log.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(log.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Modal */}
        {isViewModalOpen && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                    Log Details - ID: {selectedLog.id}
                  </h2>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setSelectedLog(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl"
                  >
                    ×
                  </button>
                </div>
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
                        <p className="text-black dark:text-zinc-50">{selectedLog.car || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Driver</label>
                        <p className="text-black dark:text-zinc-50">{selectedLog.driver || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Event Type</label>
                        <p className="text-black dark:text-zinc-50">{selectedLog.event_type || 'N/A'}</p>
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
                    {selectedLog.channels_summary && selectedLog.channels_summary.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Channels Summary</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedLog.channels_summary.map((channel, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded text-xs"
                            >
                              {channel}
                            </span>
                          ))}
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
                      <button
                        onClick={() => fetchGeoJson(selectedLog.id)}
                        disabled={loadingGeoJson}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loadingGeoJson ? 'Loading Map...' : 'View on Map'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Modal */}
        {isMapModalOpen && geoJsonData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex flex-col">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                  Map View - Log ID: {selectedLog?.id}
                </h2>
                <button
                  onClick={() => {
                    setIsMapModalOpen(false);
                    setGeoJsonData(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 relative">
                <MapComponent geoJsonData={geoJsonData} />
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                    Edit Log - ID: {selectedLog.id}
                  </h2>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedLog(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Car
                    </label>
                    <input
                      type="text"
                      value={editForm.car}
                      onChange={(e) => setEditForm({ ...editForm, car: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Driver
                    </label>
                    <input
                      type="text"
                      value={editForm.driver}
                      onChange={(e) => setEditForm({ ...editForm, driver: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Event Type
                    </label>
                    <input
                      type="text"
                      value={editForm.event_type}
                      onChange={(e) => setEditForm({ ...editForm, event_type: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleUpdateLog(selectedLog.id, false)}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : 'Update (PATCH)'}
                    </button>
                    <button
                      onClick={() => handleUpdateLog(selectedLog.id, true)}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : 'Update (PUT)'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setSelectedLog(null);
                      }}
                      className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-black dark:text-zinc-50 rounded-lg hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && logToDelete !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
                  Confirm Delete
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                  Are you sure you want to delete log ID {logToDelete}? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeleteLog(logToDelete)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setLogToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-black dark:text-zinc-50 rounded-lg hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
