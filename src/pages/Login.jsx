import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export const Login = () => {
    const { login, logActivity } = useData();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mouse Tracking State for Cursor Interaction
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 });
    const cardRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Normalized mouse positions (-1 to 1)
            const normX = (clientX / width) * 2 - 1;
            const normY = (clientY / height) * 2 - 1;

            setMousePos({ x: clientX, y: clientY });

            // Calculate tilt angle for card
            const maxTilt = 10; // degrees
            setCardTilt({
                rotateX: -normY * maxTilt,
                rotateY: normX * maxTilt
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');
        const res = await login(username, password);
        setIsSubmitting(false);
        if (res.success) {
            logActivity('Login', `User ${username} berhasil login ke dalam sistem.`);
            navigate('/');
        } else {
            setErrorMsg(res.message || 'Username atau Password yang Anda masukkan tidak valid!');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#021814',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            perspective: '1000px'
        }}>
            {/* Dynamic Spotlight Glow following Pointer */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 0,
                background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 177, 79, 0.18), rgba(0, 98, 79, 0.05) 50%, transparent 80%)`,
                transition: 'background 0.05s ease-out'
            }}></div>

            {/* Interactive Ambient Grid & Floating Mesh Nodes */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-20%',
                width: '140%',
                height: '140%',
                backgroundImage: 'radial-gradient(rgba(0, 177, 79, 0.12) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
                transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`,
                transition: 'transform 0.1s ease-out',
                pointerEvents: 'none',
                opacity: 0.6
            }}></div>

            {/* Glowing Interactive Orbs reacting to Cursor */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 177, 79, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
                top: '10%',
                left: '15%',
                transform: `translate(${-mousePos.x * 0.04}px, ${-mousePos.y * 0.04}px)`,
                transition: 'transform 0.2s ease-out',
                pointerEvents: 'none',
                filter: 'blur(40px)'
            }}></div>

            <div style={{
                position: 'absolute',
                width: '450px',
                height: '450px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 98, 79, 0.35) 0%, rgba(0, 0, 0, 0) 70%)',
                bottom: '10%',
                right: '15%',
                transform: `translate(${mousePos.x * 0.03}px, ${mousePos.y * 0.03}px)`,
                transition: 'transform 0.2s ease-out',
                pointerEvents: 'none',
                filter: 'blur(50px)'
            }}></div>

            {/* Interactive 3D Card container with smooth Cursor Tilt */}
            <div
                ref={cardRef}
                style={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    padding: '46px 40px',
                    borderRadius: '24px',
                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.4), 0 0 30px rgba(0, 177, 79, 0.15)',
                    width: '100%',
                    maxWidth: '430px',
                    boxSizing: 'border-box',
                    position: 'relative',
                    zIndex: 2,
                    transformStyle: 'preserve-3d',
                    transform: `perspective(1000px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`,
                    transition: 'transform 0.1s ease-out, box-shadow 0.2s ease'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px', transform: 'translateZ(20px)' }}>
                    {/* Animated Pulsing Logo Badge */}
                    <div style={{
                        width: '72px',
                        height: '72px',
                        background: 'linear-gradient(135deg, #00624F 0%, #00B14F 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 18px auto',
                        color: '#fff',
                        fontSize: '32px',
                        boxShadow: '0 10px 25px rgba(0, 177, 79, 0.4), inset 0 1px 1px rgba(255,255,255,0.4)',
                        transform: 'translateZ(30px)',
                        transition: 'transform 0.2s ease'
                    }}>
                        <i className="fa-solid fa-car-side"></i>
                    </div>

                    <h2 style={{ margin: '0 0 8px 0', fontSize: '25px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        GoFleet AMS
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4, fontWeight: 500 }}>
                        Silakan login untuk mengakses Asset & Role Management System
                    </p>
                </div>

                {errorMsg && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        marginBottom: '20px',
                        fontWeight: 600,
                        borderLeft: '4px solid #dc2626',
                        transform: 'translateZ(15px)'
                    }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ transform: 'translateZ(25px)' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Username Account</label>
                        <div style={{ position: 'relative' }}>
                            <i className="fa-solid fa-user" style={{ position: 'absolute', left: '14px', top: '14px', color: '#00624F', fontSize: '14px' }}></i>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Masukkan username Anda"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 14px 12px 42px',
                                    border: '1.5px solid #cbd5e1',
                                    borderRadius: '12px',
                                    fontSize: '13.5px',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#f8fafc',
                                    color: '#0f172a',
                                    fontWeight: 600
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#00624F';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(0, 98, 79, 0.12)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#cbd5e1';
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', top: '14px', color: '#00624F', fontSize: '14px' }}></i>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Masukkan password Anda"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 42px 12px 42px',
                                    border: '1.5px solid #cbd5e1',
                                    borderRadius: '12px',
                                    fontSize: '13.5px',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#f8fafc',
                                    color: '#0f172a',
                                    fontWeight: 600
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#00624F';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(0, 98, 79, 0.12)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#cbd5e1';
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <i
                                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '14px',
                                    color: '#64748b',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            ></i>
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #00624F 0%, #00B14F 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14.5px',
                            fontWeight: 800,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: isSubmitting ? 'none' : '0 6px 20px rgba(0, 177, 79, 0.35)',
                            transition: 'all 0.2s ease',
                            letterSpacing: '0.2px'
                        }}
                        onMouseEnter={e => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 177, 79, 0.45)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 177, 79, 0.35)';
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
                        ) : (
                            <><i className="fa-solid fa-right-to-bracket"></i> Masuk Ke System</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
