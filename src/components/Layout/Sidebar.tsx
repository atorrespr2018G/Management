'use client'

import React, { useState } from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Chip,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import HomeIcon from '@mui/icons-material/Home'
import AppsIcon from '@mui/icons-material/Apps'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CodeIcon from '@mui/icons-material/Code'
import TuneIcon from '@mui/icons-material/Tune'
import DescriptionIcon from '@mui/icons-material/Description'
import TimelineIcon from '@mui/icons-material/Timeline'
import MonitorIcon from '@mui/icons-material/Monitor'
import BalanceIcon from '@mui/icons-material/Balance'
import SecurityIcon from '@mui/icons-material/Security'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import StorageIcon from '@mui/icons-material/Storage'
import WorkIcon from '@mui/icons-material/Work'
import FolderIcon from '@mui/icons-material/Folder'
import HubIcon from '@mui/icons-material/Hub'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import BusinessIcon from '@mui/icons-material/Business'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  onClose?: () => void
  onToggle?: () => void
  isOpen?: boolean
}

interface MenuItem {
  text: string
  icon?: React.ReactNode
  href?: string
  badge?: string
  onClick?: () => void
  subItems?: MenuItem[]
}

interface MenuSection {
  title: string
  items: MenuItem[]
  defaultOpen?: boolean
  specialStyle?: boolean
}

export default function Sidebar({ onClose, onToggle, isOpen = true }: SidebarProps) {
  const pathname = usePathname()
  const theme = useTheme()
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'repositories': true,
    'build-and-customize': true,
    'observe-and-optimize': true,
    'protect-and-govern': true,
    'azure-openai': true,
    'my-assets': true,
  })
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({
    'connectors': true,
    'data-source': true,
    'enterprise': true,
  })

  const handleSectionToggle = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleItemToggle = (itemKey: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }))
  }

  const isSelected = (href?: string) => {
    if (!href) return false
    return pathname === href
  }

  const sections: MenuSection[] = [
    {
      title: '',
      items: [
        { text: 'Overview', icon: <HomeIcon />, href: '/' },
        { text: 'Chat', icon: <ChatBubbleOutlineIcon />, href: '/chat' },
        { text: 'Playgrounds', icon: <ChatBubbleOutlineIcon />, href: '/playgrounds' },
      ],
    },
    {
      title: 'Repositories',
      items: [
        { text: 'Connectors', icon: <StorageIcon />, href: '/repositories/connectors', subItems: [] },
        { text: 'Data Source', icon: <WorkIcon />, href: '/repositories/data-source', subItems: [] },
        { text: 'Enterprise', icon: <BusinessIcon />, href: '/repositories/enterprise', subItems: [] },
      ],
      defaultOpen: true,
    },
    {
      title: 'Build and customize',
      items: [
        { text: 'Agents', icon: <AutoAwesomeIcon />, href: '/agents' },
        { text: 'Templates', icon: <CodeIcon />, href: '/templates' },
        { text: 'Fine-tuning', icon: <TuneIcon />, href: '/fine-tuning' },
        { text: 'Content Understanding', icon: <DescriptionIcon />, href: '/content-understanding', badge: 'PREVIEW' },
      ],
      defaultOpen: true,
    },
    {
      title: 'Setup',
      items: [
        { text: 'Connectors', icon: <StorageIcon />, href: '/connectors' },
        { text: 'Structured', icon: <WorkIcon />, href: '/data-source' },
        { text: 'Enterprise', icon: <BusinessIcon />, href: '/enterprise' },
      ],
      defaultOpen: true,
    },
    {
      title: 'Observe and optimize',
      items: [
        { text: 'Tracing', icon: <TimelineIcon />, href: '/tracing', badge: 'PREVIEW' },
        { text: 'Monitoring', icon: <MonitorIcon />, href: '/monitoring' },
      ],
      defaultOpen: true,
    },
    {
      title: 'Protect and govern',
      items: [
        { text: 'Evaluation', icon: <BalanceIcon />, href: '/evaluation', badge: 'PREVIEW' },
        { text: 'Guardrails + controls', icon: <SecurityIcon />, href: '/guardrails' },
        { text: 'Risks + alerts', icon: <NotificationsActiveIcon />, href: '/risks', badge: 'PREVIEW' },
        { text: 'Governance', icon: <AccountBalanceIcon />, href: '/governance', badge: 'PREVIEW' },
      ],
      defaultOpen: true,
    },
    {
      title: 'My assets',
      items: [
        { text: 'Data + indexes', icon: <FolderIcon />, href: '/data-indexes' },
        { text: 'Models + endpoints', icon: <HubIcon />, href: '/models-endpoints' },
      ],
      defaultOpen: true,
      specialStyle: true,
    },
  ]

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.100',
        borderTopRightRadius: { md: 3 },
        overflow: 'hidden',
      }}
    >
      {/* Toggle Button */}
      {onToggle && (
        <Box
          sx={{
            p: 0.5,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
      )}

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 8 }}>
        {sections.map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            {section.title && isOpen && (
              <ListItemButton
                onClick={() => handleSectionToggle(section.title)}
                sx={{
                  py: 0.5,
                  px: 1,
                  pl: 6,
                  minHeight: 32,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.975rem',
                    letterSpacing: '0.5px',
                    pl: 2,
                  }}
                >
                  {section.title}
                </Typography>
                {openSections[section.title] ? (
                  <ExpandLess sx={{ ml: 'auto', fontSize: 32 }} />
                ) : (
                  <ExpandMore sx={{ ml: 'auto', fontSize: 32 }} />
                )}
              </ListItemButton>
            )}

            <Collapse in={isOpen ? (!section.title || openSections[section.title]) : true} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.specialStyle && (
                  <Box
                    sx={{
                      mx: isOpen ? 1 : 0.5,
                      mb: 1,
                      mt: section.title ? 1 : 0,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      p: isOpen ? 0.5 : 0.25,
                    }}
                  >
                    {section.items.map((item) => {
                      const selected = isSelected(item.href)
                      return (
                        <ListItem key={item.text} disablePadding>
                          <ListItemButton
                            component={item.href ? Link : 'div'}
                            href={item.href}
                            onClick={onClose}
                            selected={selected}
                            sx={{
                              py: 0.5,
                              px: isOpen ? 1 : 0.5,
                              pl: isOpen ? 6 : 0.5,
                              justifyContent: isOpen ? 'flex-start' : 'center',
                              borderRadius: 1,
                              mb: 0.25,
                              '&.Mui-selected': {
                                bgcolor: 'grey.200',
                                '&:hover': {
                                  bgcolor: 'grey.200',
                                },
                              },
                              '&:hover': {
                                bgcolor: 'grey.200',
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: isOpen ? 32 : 'auto',
                                justifyContent: 'center',
                                color: selected ? 'primary.main' : 'text.secondary',
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                            {isOpen && (
                              <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                  fontSize: '1.3125rem',
                                  fontWeight: selected ? 600 : 400,
                                }}
                                sx={{ pl: 2 }}
                              />
                            )}
                            {isOpen && item.badge && (
                              <Chip
                                label={item.badge}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: 'grey.300',
                                  color: 'text.secondary',
                                  ml: 1,
                                }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      )
                    })}
                  </Box>
                )}

                {!section.specialStyle &&
                  section.items.map((item) => {
                    const selected = isSelected(item.href)
                    const itemKey = item.text.toLowerCase().replace(/\s+/g, '-')
                    const hasSubItems = item.subItems !== undefined
                    const isItemOpen = hasSubItems ? openItems[itemKey] : false

                    return (
                      <React.Fragment key={item.text}>
                        <ListItem disablePadding>
                          <ListItemButton
                            component={item.href ? Link : 'div'}
                            href={item.href}
                            onClick={hasSubItems && !item.href ? () => handleItemToggle(itemKey) : onClose}
                            selected={selected && !hasSubItems}
                            sx={{
                              py: 0.5,
                              px: isOpen ? 1 : 0.5,
                              pl: isOpen ? 6 : 0.5,
                              justifyContent: isOpen ? 'flex-start' : 'center',
                              '&.Mui-selected': {
                                bgcolor: 'action.selected',
                                '&:hover': {
                                  bgcolor: 'action.selected',
                                },
                              },
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          {item.icon && (
                            <ListItemIcon
                              sx={{
                                minWidth: isOpen ? 32 : 'auto',
                                justifyContent: 'center',
                                color: selected ? 'primary.main' : 'text.secondary',
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                          )}
                          {isOpen && (
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: '1.3125rem',
                                fontWeight: selected ? 600 : 400,
                              }}
                              sx={{ pl: 2 }}
                            />
                          )}
                            {isOpen && item.badge && (
                              <Chip
                                label={item.badge}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: 'grey.300',
                                  color: 'text.secondary',
                                  ml: 1,
                                }}
                              />
                            )}
                            {isOpen && hasSubItems && !item.href && (
                              isItemOpen ? <ExpandLess sx={{ ml: 'auto', fontSize: 16 }} /> : <ExpandMore sx={{ ml: 'auto', fontSize: 16 }} />
                            )}
                          </ListItemButton>
                        </ListItem>
                        {hasSubItems && !item.href && (
                          <Collapse in={isItemOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {item.subItems && item.subItems.length > 0 ? (
                                item.subItems.map((subItem) => {
                                  const subSelected = isSelected(subItem.href)
                                  return (
                                    <ListItem key={subItem.text} disablePadding sx={{ pl: isOpen ? 4 : 2 }}>
                                      <ListItemButton
                                        component={subItem.href ? Link : 'div'}
                                        href={subItem.href}
                                        onClick={onClose}
                                        selected={subSelected}
                                        sx={{
                                          py: 0.5,
                                          px: isOpen ? 1 : 0.5,
                                          pl: isOpen ? 6 : 0.5,
                                          '&.Mui-selected': {
                                            bgcolor: 'action.selected',
                                            '&:hover': {
                                              bgcolor: 'action.selected',
                                            },
                                          },
                                          '&:hover': {
                                            bgcolor: 'action.hover',
                                          },
                                        }}
                                      >
                                        {isOpen && (
                                          <ListItemText
                                            primary={subItem.text}
                                            primaryTypographyProps={{
                                              fontSize: '1.3125rem',
                                              fontWeight: subSelected ? 600 : 400,
                                            }}
                                            sx={{ pl: 2 }}
                                          />
                                        )}
                                      </ListItemButton>
                                    </ListItem>
                                  )
                                })
                              ) : (
                                <ListItem disablePadding sx={{ pl: isOpen ? 4 : 2 }}>
                                  <Box sx={{ py: 0.5, px: isOpen ? 1 : 0.5 }}>
                                    {isOpen && (
                                      <Typography variant="body2" sx={{ fontSize: '1.3125rem', color: 'text.secondary', fontWeight: 500 }}>
                                      404
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              )}
                            </List>
                          </Collapse>
                        )}
                      </React.Fragment>
                    )
                  })}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>

      {/* More Section at Bottom */}
      <Box>
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              py: 0.5,
              px: isOpen ? 1 : 0.5,
              pl: isOpen ? 2 : 0.5,
              justifyContent: isOpen ? 'flex-start' : 'center',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: isOpen ? 32 : 'auto', justifyContent: 'center' }}>
              <MoreHorizIcon sx={{ color: 'text.secondary' }} />
            </ListItemIcon>
            {isOpen && (
              <ListItemText
                primary="More"
                primaryTypographyProps={{
                  fontSize: '1.3125rem',
                }}
                sx={{ pl: 2 }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  )
}
