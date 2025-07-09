import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Signal, SignalHigh } from 'lucide-react';

interface ConnectionStatusProps {
  showText?: boolean;
}

export function ConnectionStatus({ showText = true }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    // Check initial connection
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        setIsConnected(!error);
      } catch (err) {
        setIsConnected(false);
      }
    };
    
    checkConnection();
    
    // Set up listeners
    const channel = supabase.channel('system')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .on('system', { event: 'disconnected' }, () => {
        setIsConnected(false);
      })
      .subscribe();
    
    // Ping to check connection periodically
    const interval = setInterval(checkConnection, 30000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <div className="flex items-center">
      {isConnected ? (
        <Badge 
          variant="outline" 
          className="flex items-center bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        >
          <SignalHigh className="h-3 w-3 mr-1" />
          {showText && <span>Connected</span>}
        </Badge>
      ) : (
        <Badge 
          variant="outline" 
          className="flex items-center bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
        >
          <Signal className="h-3 w-3 mr-1" />
          {showText && <span>Reconnecting...</span>}
        </Badge>
      )}
    </div>
  );
}