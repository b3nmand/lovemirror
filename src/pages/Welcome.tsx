import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Crown, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lovemirrorLogo from '/public/lovemirror_nobg_logo.png';

const theme = {
  background: '#fef9f5',
  primaryColor: '#cf267d',
  secondaryColor: '#7b2ff7',
  accentGradient: 'linear-gradient(90deg, #cf267d, #7b2ff7)',
  fontFamily: 'Inter, Helvetica, sans-serif',
  textColor: '#1a1a1a',
  button: {
    background: '#cf267d',
    textColor: '#fff',
    hoverBackground: '#7b2ff7',
    hoverTextColor: '#fff',
  },
  card: {
    background: '#fff',
    textColor: '#1a1a1a',
    borderRadius: '16px',
    shadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  footerText: '#555',
};

const sections = [
  {
    title: 'High-Value Man Assessment',
    description: 'For men seeking to understand and improve their value',
    icon: <Scale className="w-7 h-7 text-[#cf267d]" />,
    buttonText: 'Start Assessment',
    buttonLink: '/assessment?type=high-value-man',
  },
  {
    title: 'Bridal Price Estimator',
    description: 'Traditional African bridal value estimator',
    icon: <Crown className="w-7 h-7 text-[#7b2ff7]" />,
    buttonText: 'Estimate Value',
    buttonLink: '/assessment?type=bridal-price',
  },
  {
    title: 'Wife Material Assessment',
    description: 'Modern relationship readiness evaluation',
    icon: <Gem className="w-7 h-7 text-[#7b2ff7]" />,
    buttonText: 'Take Assessment',
    buttonLink: '/assessment?type=wife-material',
  },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: theme.background,
        fontFamily: theme.fontFamily,
        color: theme.textColor,
      }}
    >
      {/* Logo */}
      <div className="flex justify-center mb-6 fade-up" style={{ animation: 'fade-up 0.7s' }}>
        <img
          src={lovemirrorLogo}
          alt="LoveMirror Logo"
          className="h-20 w-20 object-contain"
          style={{ display: 'block' }}
        />
      </div>
      {/* Title and subtitle */}
      <div className="text-center mb-2">
        <h1
          className="text-3xl sm:text-4xl font-extrabold mb-2"
          style={{
            background: theme.accentGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}
        >
          Discover Your True Value
        </h1>
        <p className="text-base sm:text-lg mt-2 mb-4" style={{ color: theme.textColor }}>
          Your journey to relationship intelligence and cultural self-awareness starts here.
        </p>
      </div>
      {/* Assessment sections */}
      <div className="w-full max-w-md space-y-5 mb-8">
        {sections.map((section, idx) => (
          <div
            key={section.title}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-md card-reveal transition cursor-pointer"
            style={{
              borderRadius: theme.card.borderRadius,
              boxShadow: theme.card.shadow,
              background: theme.card.background,
              color: theme.card.textColor,
              animation: `slide-in 0.5s ${0.1 * idx}s both`,
            }}
            onClick={() => navigate(section.buttonLink)}
          >
            <div className="bg-[#f7eafd] p-2 rounded-full flex items-center justify-center">
              {section.icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-base sm:text-lg mb-1" style={{ color: theme.textColor }}>{section.title}</div>
              <div className="text-sm" style={{ color: '#555' }}>{section.description}</div>
            </div>
            <Button
              className="ml-2 px-4 py-2 rounded-lg font-semibold text-sm transition button-hover"
              style={{
                background: theme.button.background,
                color: theme.button.textColor,
                borderRadius: '8px',
              }}
              onClick={e => {
                e.stopPropagation();
                navigate(section.buttonLink);
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = theme.button.hoverBackground;
                e.currentTarget.style.color = theme.button.hoverTextColor;
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = theme.button.background;
                e.currentTarget.style.color = theme.button.textColor;
              }}
            >
              {section.buttonText}
            </Button>
          </div>
        ))}
      </div>
      {/* Start button and privacy note */}
      <div className="flex flex-col space-y-3 w-full max-w-md">
        <Button
          onClick={() => navigate('/assessment')}
          className="w-full font-semibold text-lg py-3 rounded-lg shadow-lg transition button-hover"
          style={{
            background: theme.button.background,
            color: theme.button.textColor,
            borderRadius: '8px',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = theme.button.hoverBackground;
            e.currentTarget.style.color = theme.button.hoverTextColor;
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = theme.button.background;
            e.currentTarget.style.color = theme.button.textColor;
          }}
        >
          Start Your Assessment
        </Button>
        <p className="text-center text-xs sm:text-sm mt-2" style={{ color: theme.footerText }}>
          Your data is secure and your privacy is our priority
        </p>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.7s; }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .card-reveal { animation: slide-in 0.5s both; }
        .button-hover:hover { transform: scale(1.04); transition: transform 0.2s; }
      `}</style>
    </div>
  );
}