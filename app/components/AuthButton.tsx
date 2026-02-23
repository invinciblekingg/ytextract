"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AuthButton() {
    const { data: session, status } = useSession();
    const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetch("/api/usage")
                .then((r) => r.json())
                .then((data) => {
                    if (data.used !== undefined) setUsage(data);
                })
                .catch(() => { });
        }
    }, [session]);

    if (status === "loading") {
        return (
            <div className="flex items-center gap-2">
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                />
            </div>
        );
    }

    if (!session?.user) {
        return (
            <button
                onClick={() => signIn("google")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 18px",
                    background: "linear-gradient(135deg, #4285F4, #34A853)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(66,133,244,0.3)",
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.transform = "translateY(-1px)";
                    (e.target as HTMLElement).style.boxShadow = "0 4px 12px rgba(66,133,244,0.4)";
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.transform = "translateY(0)";
                    (e.target as HTMLElement).style.boxShadow = "0 2px 8px rgba(66,133,244,0.3)";
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#fff"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#fff"
                        opacity={0.9}
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#fff"
                        opacity={0.8}
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#fff"
                        opacity={0.7}
                    />
                </svg>
                Sign in
            </button>
        );
    }

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "4px 12px 4px 4px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "100px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLElement).closest("button")!.style.background = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLElement).closest("button")!.style.background = "rgba(255,255,255,0.08)";
                }}
            >
                <img
                    src={session.user.image || ""}
                    alt={session.user.name || "User"}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.2)",
                    }}
                    referrerPolicy="no-referrer"
                />
                {usage && (
                    <span
                        style={{
                            fontSize: "12px",
                            color: usage.remaining <= 1 ? "#f87171" : "rgba(255,255,255,0.7)",
                            fontWeight: 500,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {usage.used}/{usage.limit}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 40,
                        }}
                        onClick={() => setShowDropdown(false)}
                    />
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 8px)",
                            width: "240px",
                            background: "rgba(15,15,15,0.95)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            padding: "12px",
                            zIndex: 50,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        }}
                    >
                        <div style={{ padding: "4px 8px", marginBottom: "8px" }}>
                            <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>
                                {session.user.name}
                            </p>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "rgba(255,255,255,0.5)",
                                    margin: "2px 0 0",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {session.user.email}
                            </p>
                        </div>

                        {usage && (
                            <div
                                style={{
                                    padding: "8px",
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: "8px",
                                    marginBottom: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "12px",
                                        color: "rgba(255,255,255,0.6)",
                                        marginBottom: "6px",
                                    }}
                                >
                                    <span>Downloads used</span>
                                    <span
                                        style={{
                                            color: usage.remaining <= 1 ? "#f87171" : "#a78bfa",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {usage.used}/{usage.limit}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "4px",
                                        background: "rgba(255,255,255,0.1)",
                                        borderRadius: "2px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${(usage.used / usage.limit) * 100}%`,
                                            height: "100%",
                                            background:
                                                usage.remaining <= 1
                                                    ? "linear-gradient(90deg, #f87171, #ef4444)"
                                                    : "linear-gradient(90deg, #a78bfa, #8b5cf6)",
                                            borderRadius: "2px",
                                            transition: "width 0.3s ease",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => signOut()}
                            style={{
                                width: "100%",
                                padding: "8px",
                                background: "rgba(239,68,68,0.1)",
                                color: "#f87171",
                                border: "1px solid rgba(239,68,68,0.2)",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.background = "rgba(239,68,68,0.2)";
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                            }}
                        >
                            Sign out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
