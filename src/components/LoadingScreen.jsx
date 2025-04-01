import React from "react";

const LoadingScreen = () => {
    return (
        <div style={styles.loadingContainer}>
            <h1 style={styles.loadingText}>Frostwave</h1>
            <div style={styles.dotsContainer}>
                <span style={styles.dot}></span>
                <span style={styles.dot}></span>
                <span style={styles.dot}></span>
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
        fontSize: "48px", // Increased font size drastically
        fontWeight: "bold",
        marginBottom: "60px", // Increased spacing for better proportion
    },
    dotsContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "30px", // Increased gap between dots
    },
    dot: {
        width: "20px", // Larger dot size
        height: "20px",
        backgroundColor: "#FF0000",
        borderRadius: "50%",
        animation: "dotPulse 1.5s infinite ease-in-out",
    },
};

// Adding the animation style as a global CSS
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes dotPulse {
    0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.3;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default LoadingScreen;