# openlayer-v3-bounce-animation
Bounce animation for features pointer in openlayer v3.19.1

# How to use

1. import bounce.js in your page:

```html
<script src="bounce.js"> </script>
```

2. Just call **feature.playBouncing** with instance of **map** and **layer** of feature.


# Example
```javascript
//*Where layer is instanceof: ol.layer.Layer 
 feature.playBouncing(map, layer);
 
```
![Example 1](https://raw.githubusercontent.com/jefferson/openlayer-v3-bounce-animation/master/bounce_animation.PNG)
