export default function LogoMark({ className = '', size = 28 }) {
    return (
        <span className={`logo-mark ${className}`.trim()} aria-hidden="true" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M5 10l7-7 7 7" />
            </svg>
        </span>
    );
}
