import React, { useState } from 'react';
import TabDashboard from '../components/analisis/TabDashboard';
import TabPrediksi from '../components/analisis/TabPrediksi';
import TabPrediksiBatch from '../components/analisis/TabPrediksiBatch';
import TabClustering from '../components/analisis/TabClustering';

export const AnalisisKelayakan = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-0 text-primary"><i className="fa-solid fa-chart-pie me-2"></i> Simulator Prediksi & Analisis Aset</h2>
                    <p className="text-muted">Sistem Intelijen Decision Engine & Segmentasi Berbasis Machine Learning</p>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} type="button" role="tab">
                                <i className="fa-solid fa-chart-bar me-1"></i> Dashboard & Overview
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button className={`nav-link ${activeTab === 'prediksi' ? 'active' : ''}`} onClick={() => setActiveTab('prediksi')} type="button" role="tab">
                                <i className="fa-solid fa-bullseye me-1"></i> Prediksi Single
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button className={`nav-link ${activeTab === 'prediksi_batch' ? 'active' : ''}`} onClick={() => setActiveTab('prediksi_batch')} type="button" role="tab">
                                <i className="fa-solid fa-list-check me-1"></i> Prediksi Massal
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button className={`nav-link ${activeTab === 'clustering' ? 'active' : ''}`} onClick={() => setActiveTab('clustering')} type="button" role="tab">
                                <i className="fa-solid fa-diagram-project me-1"></i> Segmentasi K-Means
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body bg-light">
                    <div className="tab-content" id="myTabContent">
                        {activeTab === 'dashboard' && <TabDashboard />}
                        {activeTab === 'prediksi' && <TabPrediksi />}
                        {activeTab === 'prediksi_batch' && <TabPrediksiBatch />}
                        {activeTab === 'clustering' && <TabClustering />}
                    </div>
                </div>
            </div>
        </div>
    );
};
