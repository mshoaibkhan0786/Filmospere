import React from 'react';
import { Film } from 'lucide-react';

interface LogoProps {
    suffix?: string;
}

const Logo: React.FC<LogoProps> = ({ suffix }) => {
    return (
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}>
            <Film size={32} color="#E50914" strokeWidth={2.8} className="logo-icon" />
            <span className="logo-text" style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#E50914',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'baseline'
            }}>
                Filmospere
                {suffix && (
                    <span style={{
                        fontWeight: 'bold',
                        marginLeft: '8px',
                        color: '#E50914',
                        fontSize: '1.5rem',
                        letterSpacing: '-0.5px', // Match parent
                        fontFamily: 'inherit'
                    }}>{suffix}</span>
                )}
            </span>
        </div>
    );
};

export default Logo;
