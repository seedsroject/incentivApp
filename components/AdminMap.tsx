
import React, { useEffect, useState } from 'react';
import { MapContainer, GeoJSON, Marker, Popup, useMap, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Nucleo, StudentDraft } from '../types';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons based on Stock Status
const createStockIcon = (status: 'LOW' | 'MEDIUM' | 'HIGH' | undefined) => {
    let color = 'gray';
    if (status === 'HIGH') color = '#10B981'; // Green-500
    if (status === 'MEDIUM') color = '#F59E0B'; // Yellow-500
    if (status === 'LOW') color = '#EF4444'; // Red-500

    // Create a custom SVG icon
    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" class="w-8 h-8 drop-shadow-lg">
      <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
    </svg>
  `;

    return L.divIcon({
        html: svgIcon,
        className: 'bg-transparent',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

interface AdminMapProps {
    nucleos: Nucleo[];
    selectedNucleoId?: string | null;
    onSelectNucleo: (id: string) => void;
    filterStatus?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
    activeTab?: 'estoque' | 'alunos' | 'nucleos';
    students?: StudentDraft[];
}

// Component to handle map interactions like Zoom
const MapController: React.FC<{ selectedNucleo: Nucleo | undefined }> = ({ selectedNucleo }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedNucleo && selectedNucleo.coordinates) {
            map.flyTo(selectedNucleo.coordinates, 15, {
                duration: 2.0, // Slower, smoother zoom
                easeLinearity: 0.25
            });
        }
    }, [selectedNucleo, map]);

    return null;
};

// Component to sort of track zoom for conditional rendering
const ZoomTracker: React.FC<{ onZoomChange: (z: number) => void }> = ({ onZoomChange }) => {
    const map = useMap();
    useEffect(() => {
        const handler = () => onZoomChange(map.getZoom());
        map.on('zoomend', handler);
        return () => { map.off('zoomend', handler); };
    }, [map, onZoomChange]);
    return null;
};

// Component to reset view when filter is cleared
const ViewResetter: React.FC<{ filterStatus: string | null | undefined }> = ({ filterStatus }) => {
    const map = useMap();
    useEffect(() => {
        if (!filterStatus) {
            map.closePopup();
            map.flyTo([-14.235, -51.9253], 4, { duration: 1.5 });
        }
    }, [filterStatus, map]);
    return null;
};

// Force map to recalculate size on mount to avoid partial rendering
const MapResizer: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        // Immediate invalidation
        map.invalidateSize();

        // Invalidation after short delay (for quick renders)
        const t1 = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        // Invalidation after longer delay (for animations/transitions)
        const t2 = setTimeout(() => {
            map.invalidateSize();
        }, 400);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [map]);
    return null;
};

export const AdminMap: React.FC<AdminMapProps> = ({ nucleos, selectedNucleoId, onSelectNucleo, filterStatus, activeTab = 'estoque', students = [] }) => {
    const selectedNucleo = nucleos.find(n => n.id === selectedNucleoId);
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [currentZoom, setCurrentZoom] = useState(4);

    // Filter displayed nuclei
    const displayedNucleos = filterStatus
        ? nucleos.filter(n => n.stockStatus === filterStatus)
        : nucleos;

    // Load GeoJSON
    useEffect(() => {
        fetch('/brazil-states.json')
            .then(response => response.json())
            .then(data => setGeoJsonData(data))
            .catch(error => console.error("Error loading GeoJSON:", error));
    }, []);

    // Calculate Nuclei per State
    const getNucleiCount = (stateSigla: string) => {
        // Assume nucleo.nome contains " | XX - " or similar. 
        // We will look for the 2-letter code in the Nucleo name or map exact locations if needed.
        // For now, looking for " | UF" pattern in MOCK names.
        // Example: "Ilhéus | BA"
        const count = nucleos.filter(n => n.nome.includes(` | ${stateSigla}`)).length;
        return count;
    };

    // Style Calculation for Heatmap
    // Style Calculation for Heatmap
    const style = (feature: any) => {
        const stateSigla = feature.properties.sigla; // 'BA', 'SP', etc. from GeoJSON
        const count = getNucleiCount(stateSigla);

        // Heatmap Logic: 
        // 0-1: Green (Cold/Few)
        // 2-3: Yellow (Medium)
        // 4-5: Orange (high)
        // 6+: Red (Hot/Many)

        let fillColor = '#10B981'; // Green-500 (Default/Low)
        if (count >= 2) fillColor = '#FBBF24'; // Amber-400
        if (count >= 4) fillColor = '#F97316'; // Orange-500
        if (count >= 6) fillColor = '#EF4444'; // Red-500

        return {
            fillColor: fillColor,
            weight: 1,
            opacity: 1,
            color: 'white', // Border color
            dashArray: '3',
            fillOpacity: 0.6
        };
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const stateSigla = feature.properties.sigla;
        const count = getNucleiCount(stateSigla);

        layer.bindTooltip(`<strong>${feature.properties.name}</strong><br/>${count} Núcleos`, {
            sticky: true,
            direction: 'top'
        });

        // Click to zoom to state
        layer.on({
            click: (e) => {
                const map = e.target._map;
                map.fitBounds(e.target.getBounds());
            }
        });
    };

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative z-0 bg-slate-100">
            <MapContainer
                center={[-14.235, -51.9253]}
                zoom={4}
                minZoom={3} // Adjusted to allow seeing whole country comfortably
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
                className="z-0"
                zoomControl={false}
            >
                <ZoomTracker onZoomChange={setCurrentZoom} />
                <MapResizer />
                <ViewResetter filterStatus={filterStatus} />
                <MapController selectedNucleo={selectedNucleo} />
                <ZoomControl position="topleft" />

                {/* Add standard TileLayer for 'Real Streets' - Carto Voyager is clean but detailed */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Render Heatmap ONLY at low zoom levels to allow street view at high zoom */}
                {geoJsonData && currentZoom < 8 && (
                    <GeoJSON
                        data={geoJsonData}
                        style={style}
                        onEachFeature={onEachFeature}
                    />
                )}

                {displayedNucleos.map(nucleo => (
                    nucleo.coordinates && (
                        <Marker
                            key={nucleo.id}
                            position={nucleo.coordinates}
                            icon={createStockIcon(nucleo.stockStatus)}
                            eventHandlers={{
                                click: () => onSelectNucleo(nucleo.id),
                            }}
                        >
                            <Popup className="rounded-xl overflow-hidden shadow-xl border-0">
                                <div className="p-1 min-w-[200px]">
                                    <h3 className="font-bold text-gray-800 text-sm mb-1">{nucleo.nome.split(' - ')[0]}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{nucleo.nome.split(' - ')[1] || nucleo.nome}</p>

                                    {activeTab === 'estoque' ? (
                                        <>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`h-2.5 w-2.5 rounded-full ${nucleo.stockStatus === 'HIGH' ? 'bg-green-500' :
                                                    nucleo.stockStatus === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}></span>
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {nucleo.stockStatus === 'HIGH' ? 'Adequado' :
                                                        nucleo.stockStatus === 'MEDIUM' ? 'Atenção' : 'Crítico'}
                                                </span>
                                            </div>
                                            {/* Stock Details in Popup */}
                                            {nucleo.stockDetails && (
                                                <div className="mt-3 bg-gray-50 p-2 rounded-lg">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Itens em Estoque</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {nucleo.stockDetails.map((item, idx) => (
                                                            <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded ${item.status === 'LOW' ? 'bg-red-100 text-red-700 font-bold' : 'bg-white border border-gray-100 text-gray-600'}`}>
                                                                {item.qty} {item.item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : activeTab === 'alunos' ? (
                                        /* Alunos Tab Content */
                                        <div className="mt-2">
                                            {(() => {
                                                const nucleoStudents = students.filter(s => s.nucleo_id === nucleo.id);
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`h-2.5 w-2.5 rounded-full ${nucleoStudents.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                                            <span className="text-xs font-semibold text-gray-700">
                                                                {nucleoStudents.length} Aluno{nucleoStudents.length !== 1 ? 's' : ''} Cadastrado{nucleoStudents.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                        {nucleoStudents.length > 0 && (
                                                            <div className="mt-3 bg-blue-50 p-2 rounded-lg">
                                                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Alunos</p>
                                                                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                                                                    {nucleoStudents.slice(0, 5).map((student, idx) => (
                                                                        <div key={student.id || idx} className="text-[10px] text-gray-600 truncate">
                                                                            {student.nome}
                                                                        </div>
                                                                    ))}
                                                                    {nucleoStudents.length > 5 && (
                                                                        <p className="text-[9px] text-blue-500 font-bold">+{nucleoStudents.length - 5} mais...</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        /* Nucleos Tab Content */
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2.5 w-2.5 rounded-full ${nucleo.employees && nucleo.employees.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {nucleo.employees?.length || 0} Funcionário{(nucleo.employees?.length || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {nucleo.employees && nucleo.employees.length > 0 && (
                                                <div className="mt-3 bg-blue-50 p-2 rounded-lg">
                                                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Equipe</p>
                                                    <div className="space-y-1 max-h-[100px] overflow-y-auto">
                                                        {nucleo.employees.slice(0, 5).map((emp, idx) => (
                                                            <div key={emp.id || idx} className="text-[10px] text-gray-600 truncate flex justify-between">
                                                                <span>{emp.name}</span>
                                                                <span className="text-blue-400 text-[9px] font-medium">{emp.role}</span>
                                                            </div>
                                                        ))}
                                                        {nucleo.employees.length > 5 && (
                                                            <p className="text-[9px] text-blue-500 font-bold">+{nucleo.employees.length - 5} mais...</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
};
