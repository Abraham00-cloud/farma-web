import React from 'react';

interface FarmaLogoProps {
    className?: string;
    size?: number;
}

export const FarmaLogo: React.FC<FarmaLogoProps> = ({
    className = "text-[#9A3412]",
    size = 32,
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Hexagonal Biosecurity Badge */}
            <path
                d="M16 2L28 8.9282V23.0718L16 30L4 23.0718V8.9282L16 2Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            {/* Precision Poultry/Flock Silhouette */}
            <path
                d="M12 20C12 16 14.5 13 18 13C19.5 13 21 13.5 22 14.5C21.5 11 19 9 15.5 9C12 9 9.5 11.5 9 15C8.5 14.5 7.5 14.5 7 15C6.5 15.5 6.5 16.5 7.5 17C9.5 18 10.5 19.5 12 20Z"
                fill="currentColor"
            />
            {/* Telemetry Node Ring */}
            <circle cx="20" cy="11" r="2" fill="#15803D" />
            <path
                d="M11 22L16 25L21 22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
};