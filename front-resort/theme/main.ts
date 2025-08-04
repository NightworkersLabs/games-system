
import { extendTheme } from '@chakra-ui/react'
import { StepsTheme } from 'chakra-ui-steps'

const theme = extendTheme({
  colors: {
    brand: {
      600: '#f7fafc'
    }
  },
  styles: {
    global: {
      body: {
        bg: 'black',
        color: 'white'
      }
    }
  },
  components: {
    StepsTheme,
    Link: {
      baseStyle: {
        bgColor: '#d5898969', px: '1', borderRadius: '5px'
      }
    },
    Switch: { baseStyle: { _focus: { boxShadow: 'none' } } },
    Button: {
      defaultProps: {
        variant: 'simple'
      },
      variants: {
        unstyled: {},
        simple: {
          fontFamily: '"Press Start 2P", cursive',
          background: '#ed5af7',
          _hover: { bgColor: 'blackAlpha.800', color: '#ed5af7', transform: 'scale(1.02)' },
          _active: { bgColor: 'blackAlpha.800', color: 'white' },
          borderRadius: 'none',
          border: '4px',
          borderColor: '#ed5af7',
          bg: 'blackAlpha.600'
        },
        glowing: {
          fontFamily: '"Press Start 2P", cursive',
          background: '#ed5af7',
          boxShadow: '0px 0px 13px 0px #e51cc5',
          _hover: { background: '#ed5af7', boxShadow: '0px 0px 13px 0px #e51cc5', transform: 'scale(1.02)' },
          _active: { background: '#ed5af7', boxShadow: '0px 0px 13px 0px #e51cc5' },
          _focus: { background: '#ed5af7', boxShadow: '0px 0px 13px 0px #e51cc5' }
        }
      }
    },
    IconButton: { baseStyle: { _focus: { boxShadow: 'none' } } },
    Input: {
      variants: {
        outline: {
          field: {
            background: 'inherit',
            border: '1px solid',
            borderColor: 'inherit',
            _focus: {
              zIndex: 1,
              borderColor: '#BBB',
              boxShadow: 'none'
            },
            _hover: { borderColor: 'gray.300' }
          }
        }
      }
    },
    ModalCloseButton: { baseStyle: { _focus: { boxShadow: 'none' } } },
    Drawer: { baseStyle: { backgroundColor: '#fff0' } },
    Checkbox: {
      baseStyle: {
        control: {
          _checked: {
            bg: 'transparent',
            borderColor: 'white',
            _hover: {
              borderColor: '#BBB',
              bgColor: 'transparent',
              color: '#BBB'
            }
          },
          _hover: {
            bgColor: '#333',
            color: 'red'
          }
        }
      }
    }
  },
  shadows: {
    outline: 'none'
  }
})

export default theme
