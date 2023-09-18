ig.module('site.test')
  .requires('impact.deps.crossani')
  .defines(() => {
    console.log(KEY_SPLINES.EASE);
    const box = document.querySelector('.box');

    box.transitions = {
      default: {
        state: {},
        reset: true,
        ms: 500,
        easing: KEY_SPLINES.EASE.ease,
      },

      step1: {
        state: {
          'background-color': 'blue',
          border: '2px dashed red',
        },
        ms: 250,
        easing: KEY_SPLINES.EASE.linear,
      },

      step2: {
        state: {
          width: '250px',
          height: '90px',
        },
        ms: 300,
        easing: KEY_SPLINES.EASE.in,
      },

      step3: {
        state: {
          transform: 'rotate(170deg)',
          'margin-left': '15rem',
        },
        ms: 600,
        easing: KEY_SPLINES.EASE.out,
      },

      step4: {
        state: {
          background: 'radial-gradient(circle at 110px, red, green)',
          'border-radius': '50%',
          'box-shadow': '0 0 10px black',
          transform: 'rotate(170deg) translateX(50px) skewY(40deg)',
        },
        ms: 150,
        easing: KEY_SPLINES.EASE.inOut,
      },
    };

    function demoAnimation() {
      box.doTransition('step1').then(() => console.log('transition step1 ended'));
      box.doTransition('step2').then(() => console.log('transition step2 ended'));
      box.doTransition('step3').then(() => console.log('transition step3 ended'));
      box.doTransition('step4').then(() => console.log('transition step4 ended'));
    }
    window.demoAnimation = demoAnimation;
  });
