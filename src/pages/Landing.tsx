import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, Shield, Heart, Eye, Target, Clock } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Male');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartAssessment = () => {
    navigate('/auth');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Responsive sizing */}
            <div className="flex items-center space-x-2">
              <img 
                src="/homeimage.png" 
                alt="LoveMirror Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-[70px] lg:h-[70px] rounded-lg object-cover"
              />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <button 
                onClick={() => scrollToSection('value-proposition')}
                className="bg-white text-[#1B1B1B] hover:bg-gray-50 transition-colors font-medium px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-sm lg:text-base"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="bg-white text-[#1B1B1B] hover:bg-gray-50 transition-colors font-medium px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-sm lg:text-base"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="bg-white text-[#1B1B1B] hover:bg-gray-50 transition-colors font-medium px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-sm lg:text-base"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="bg-white text-[#1B1B1B] hover:bg-gray-50 transition-colors font-medium px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-sm lg:text-base"
              >
                FAQ
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollToSection('faq')}
                className="bg-white text-[#1B1B1B] hover:bg-gray-50 border-gray-300 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
              >
                FAQ
              </Button>
            </div>

            {/* Sign In Button - Responsive sizing */}
            <Button
              onClick={handleSignIn}
              variant="outline"
              size="sm"
              className="border-[#FF158A] text-[#FF158A] hover:bg-[#FF158A] hover:text-white transition-all text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 lg:text-base"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-32" style={{ background: 'linear-gradient(to bottom right, #FFF7F3, white)' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1B1B1B] mb-4 sm:mb-6 leading-tight">
            See Yourself Clearly.{' '}
            <span className="text-[#FF158A]">Love Better.</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-xl lg:text-2xl text-[#5F6368] max-w-4xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
            Get three science-backed scores—Self Awareness, Partner Compatibility, and the Delusional Score (how others see you)—plus a simple action plan.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-4">
            <Button
              onClick={handleStartAssessment}
              size="lg"
              className="w-full sm:w-auto bg-[#FF158A] hover:bg-[#E0147A] text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Assessment
            </Button>
            <Button
              onClick={() => scrollToSection('app-showcase')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-[#5A3DFF] text-[#5A3DFF] hover:bg-[#5A3DFF] hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all"
            >
              See Sample Report
            </Button>
          </div>
        </div>
      </section>



      {/* App Showcase */}
      <section id="app-showcase" className="py-12 sm:py-16 md:py-20" style={{ background: 'linear-gradient(to bottom right, #FFF7F3, white)' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-3 sm:mb-4">
              See Your Results in Action
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#5F6368] max-w-3xl mx-auto px-2">
              Get instant insights with AI-powered analysis, personalized growth plans, and comprehensive assessments
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-center mb-8 sm:mb-12 max-w-none">
            {/* Growth Plan Image */}
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 mb-3 sm:mb-4">
                <img 
                  src="/growthplan.png" 
                  alt="Personal Development Plan" 
                  className="w-2/3 sm:w-1/2 h-auto rounded-lg mx-auto"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#1B1B1B]">Personal Development Plan</h3>
              <p className="text-xs sm:text-sm text-[#5F6368] mt-2">Track your growth across mental, emotional, and physical traits</p>
            </div>

            {/* AI Chat Image */}
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 mb-3 sm:mb-4">
                <img 
                  src="/aichat.png" 
                  alt="AI Relationship Mentor" 
                  className="w-2/3 sm:w-1/2 h-auto rounded-lg mx-auto"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#1B1B1B]">AI Relationship Mentor</h3>
              <p className="text-xs sm:text-sm text-[#5F6368] mt-2">Get personalized advice and insights for your relationships</p>
            </div>

            {/* Personal Development iPhone Image */}
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 mb-3 sm:mb-4">
                <img 
                  src="/personaldevelopment_iphon.png" 
                  alt="Mobile Development Plan" 
                  className="w-2/3 sm:w-1/2 h-auto rounded-lg mx-auto"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#1B1B1B]">Mobile Development Plan</h3>
              <p className="text-xs sm:text-sm text-[#5F6368] mt-2">Access your growth plan anywhere, anytime</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={handleStartAssessment}
              size="lg"
              className="w-full sm:w-auto bg-[#FF158A] hover:bg-[#E0147A] text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Your Assessment
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="value-proposition" className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-4">
              Three scores. One clear picture.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Self Score',
                text: 'Your strengths & blind spots across emotional, mental, physical, financial, family/culture, and conflict habits.',
                icon: Eye,
                color: 'from-[#FF158A] to-[#E0147A]'
              },
              {
                title: 'Compatibility Score',
                text: 'Side-by-side with your partner to spot alignment and friction by category.',
                icon: Heart,
                color: 'from-[#5A3DFF] to-[#4A2DEF]'
              },
              {
                title: 'Delusional Score',
                text: 'Compare your self-view with how up to four trusted people experience you (anonymous).',
                icon: Target,
                color: 'from-[#FF6B35] to-[#E55A2A]'
              }
            ].map((item, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#1B1B1B]">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-[#5F6368] leading-relaxed">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section id="who-we-are" className="py-20" style={{ backgroundColor: '#FFF7F3' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-6">
                Who We Are
              </h2>
              <p className="text-lg text-[#5F6368] leading-relaxed mb-8">
                LoveMirror is a relationship self-awareness platform created by designers and behavioral strategists. We blend modern psychology with culture-aware tools so people can love more skillfully.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#FF158A] rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-[#1B1B1B]">Our Aim</h3>
                    <p className="text-[#5F6368]">Give people a clear, compassionate mirror to grow love with skill.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#5A3DFF] rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-[#1B1B1B]">Our Mission</h3>
                    <p className="text-[#5F6368]">Turn relationship guesswork into measurable insight and doable action using quick assessments, anonymized feedback, and cultural modules.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#FF6B35] rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-[#1B1B1B]">Our Vision</h3>
                    <p className="text-[#5F6368]">A world where couples and singles make informed, brave decisions based on deep self- and other-understanding.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="/homeimage.png" 
                alt="LoveMirror Sample Report" 
                className="w-full h-auto rounded-3xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              'Answer 24 quick questions (3–4 minutes).',
              'Invite your partner and up to 4 trusted people.',
              'See your dashboard and a 7-day action plan.'
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF158A] to-[#5A3DFF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{index + 1}</span>
                </div>
                <p className="text-lg text-[#5F6368] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Module */}
      <section id="culture-module" className="py-20 bg-[#FFF7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-4">
              Culture-Aware Tools
            </h2>
            <p className="text-lg text-[#5F6368] max-w-3xl mx-auto">
              Switch to a culture-aware view with family roles, religion, and regional norms. Bridal Price uses local benchmarks and gold/income calibration.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {['Modern Readiness', 'Family & Culture', 'Bridal Price (optional)'].map((chip) => (
              <Badge key={chip} variant="secondary" className="px-4 py-2 text-sm bg-white border border-gray-200">
                {chip}
              </Badge>
            ))}
          </div>


        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-4">
              Who It's For
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Couples', blurb: 'Partners who want clarity before commitment.' },
              { label: 'Singles', blurb: 'Daters who want honesty over honeymoon haze.' },
              { label: 'Self-Aware Seekers', blurb: 'Curious minds who value personal growth.' },
              { label: 'Hopeful Romantics', blurb: 'Dreamers who want data to back it up.' },
              { label: 'Realists', blurb: 'People who want truth, not fairy tales.' }
            ].map((segment, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-[#1B1B1B] mb-2">{segment.label}</h3>
                  <p className="text-[#5F6368]">{segment.blurb}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20" style={{ backgroundColor: '#FFF7F3' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-4">
              Powerful Features
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              'Three Score System: Self, Compatibility, Delusional',
              'Family & Culture module with regional norms',
              'Optional Bridal Price estimator with transparent weights',
              'Progress tracking with quarterly retakes',
              'Consent-based partner linking and side-by-side dashboards',
              'Privacy-by-design: anonymized raters and data control'
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-[#FF158A] mt-0.5 flex-shrink-0" />
                <span className="text-[#5F6368] leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-4">
              Simple, Transparent Pricing
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: '1 Month',
                price: 6.99,
                interval: 'month',
                popular: false,
                features: [
                  'AI Development Plan',
                  'Compatibility Reports',
                  'Delusional Score Insights',
                  'Basic Support'
                ]
              },
              {
                name: '3 Months',
                price: 15,
                interval: '3 months',
                popular: true,
                features: [
                  'Progress Tracking',
                  'External Assessor Tools',
                  'Priority Support',
                  'All 1 Month Features'
                ]
              },
              {
                name: '6 Months',
                price: 24,
                interval: '6 months',
                popular: false,
                features: [
                  'Unlimited Assessments',
                  'Priority Support',
                  'Advanced Analytics',
                  'All 3 Month Features'
                ]
              },
              {
                name: '12 Months',
                price: 36,
                interval: '12 months',
                popular: false,
                features: [
                  'AI Relationship Coach',
                  'Exclusive Content',
                  'VIP Support',
                  'All 6 Month Features'
                ]
              }
            ].map((plan, index) => (
              <Card key={index} className={`border-2 ${plan.popular ? 'border-[#FF158A] shadow-xl' : 'border-gray-200'} relative`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#FF158A] text-white px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-[#1B1B1B]">{plan.name}</CardTitle>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#1B1B1B]">£{plan.price}</span>
                    <span className="text-[#5F6368] text-sm"> / {plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-[#FF158A] mt-0.5 flex-shrink-0" />
                        <span className="text-[#5F6368] text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleStartAssessment}
                    className={`w-full mt-6 ${plan.popular ? 'bg-[#FF158A] hover:bg-[#E0147A]' : 'bg-[#5A3DFF] hover:bg-[#4A2DEF]'} text-white`}
                  >
                    {plan.name === '1 Month' ? 'Start Free' : `Get ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20" style={{ backgroundColor: '#FFF7F3' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1B1B1B] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[#5F6368] mb-8">
              Find answers to common questions about LoveMirror
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                q: 'Is this therapy?',
                a: 'No—it\'s a self-awareness tool. We signpost to professional help when red flags persist.'
              },
              {
                q: 'Will anyone see my answers?',
                a: 'Your answers are private; external ratings are anonymized and aggregated.'
              },
              {
                q: 'Do I have to use Bridal Price?',
                a: 'No. It\'s optional and only appears in relevant regions with transparent controls.'
              },
              {
                q: 'What if my partner won\'t participate?',
                a: 'You\'ll still get your Self Score and plan; add partner results any time.'
              }
            ].map((faq, index) => (
              <Accordion key={index} type="single" collapsible className="w-full">
                <AccordionItem value={`item-${index}`} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-white rounded-t-lg text-left">
                    <span className="font-semibold text-[#1B1B1B]">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 bg-white rounded-b-lg">
                    <p className="text-[#5F6368] leading-relaxed">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white" style={{ background: 'linear-gradient(to bottom right, #FF158A, #5A3DFF)' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to See Yourself Clearly?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of people who are building better relationships through self-awareness.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={handleStartAssessment}
              size="lg"
              className="bg-white text-[#FF158A] hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Assessment
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-white" style={{ backgroundColor: '#1B1B1B' }}>
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-400">
            <p>&copy; 2024 LoveMirror. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
