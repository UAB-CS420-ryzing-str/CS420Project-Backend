process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app.js');
var should = chai.should();

chai.use(chaiHttp);

describe('/GET data', () => {
  it('it should return a json containing a bunch of data.', (done) => {
    chai.request(server).get("/get/location/minLat/-20/maxLat/0/minLong/160/maxLong/180/dataset/default").end((err, res) => {

        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.equal(1600);
        done();
    });
  });
});

describe('/GET invalid URL', () => {
  it('it should return a 404 error.', (done) => {
    chai.request(server).get("/b;lajdf;lkajdflkjad").end((err, res) => {
      res.should.have.status(404);
      done();
    });
  });
});
