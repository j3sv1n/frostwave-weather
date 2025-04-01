import React from "react";

const LoadingScreen = () => {
    return (
        <div style={styles.loadingContainer}>
            <h1 style={styles.loadingText}>Frostwave</h1>
            <div style={styles.iconsContainer}>
                <span style={{ ...styles.icon, animationDelay: "0s" }}>☀️</span>
                <span style={{ ...styles.icon, animationDelay: "0.5s" }}>🌧️</span>
                <span style={{ ...styles.icon, animationDelay: "1s" }}>❄️</span>
            </div>
        </div>
    );
};

const styles = {
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#000",
    },
    loadingText: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "bold",
        marginBottom: "20px", // Reduced spacing here for closer alignment with emojis
    },
    iconsContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px", // Adjusted gap between emojis for balanced spacing
    },
    icon: {
        fontSize: "40px", // Emoji size
        animation: "iconFade 1.5s infinite ease-in-out",
        opacity: 0,
    },
};

// Adding the animation style as a global CSS
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes iconFade {
    0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.3;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default LoadingScreen;