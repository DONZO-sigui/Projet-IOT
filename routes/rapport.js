const express = require('express');
const router = express.Router();

const pages = ['introduction', 'definition', 'architecture', 'technologies', 'etude-peche', 'conception', 'discussion', 'conclusion'];

pages.forEach(page => {
  router.get(`/${page}`, (req, res) => {
    res.render(`rapport/${page}`, { title: `Proj_iot - ${page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')}` });
  });
});

module.exports = router;


