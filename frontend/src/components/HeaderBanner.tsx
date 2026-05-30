import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Tooltip } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

// Define the SVG icon as a React component
const AppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="256" 
    height="256" 
    viewBox="0 0 256 256" fill="none"
    style={{ marginRight: '10px' }}
    {...props}
  >
    <rect width="256" height="256" fill="#F0F4F8"/>
    <path d="M71 96C71 85.5033 79.5033 77 90 77H156L186 107M71 160V96M71 160H90C100.497 160 109 151.497 109 141V128" stroke="#007BFF" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="150" cy="120" r="35" stroke="#343A40" strokeWidth="14"/>
    <line x1="178" y1="148" x2="205" y2="175" stroke="#343A40" strokeWidth="18" strokeLinecap="round"/>
    <circle cx="150" cy="120" r="24" fill="#E7F5FF"/>
  </svg>
);

const HeaderBanner = () => {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  return (
    <AppBar position="static" sx={{ bgcolor: '#F0F4F8', borderBottom: '1px solid', borderColor: 'grey.300', boxShadow: 'none' }}>
      <Toolbar>
        <AppIcon 
          width="64"
          height="64"
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1, color: "#007BFF"}} component="div">
          Redirect Inspector
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAuthenticated && user ? (
            <>
              <Tooltip title={user.name || "User Account"}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    src={user.picture} 
                    alt={user.name || "User"} 
                    sx={{ width: 32, height: 32, border: '1px solid', borderColor: 'primary.main' }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.primary', display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
                    {user.nickname || user.name}
                  </Typography>
                </Box>
              </Tooltip>
              
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                startIcon={<LogoutIcon />}
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              >
                Log Out
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              size="small" 
              startIcon={<LoginIcon />}
              onClick={() => loginWithRedirect()}
            >
              Log In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBanner;