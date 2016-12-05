process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app.js');
var should = chai.should();

chai.use(chaiHttp);

describe('/GET health', () => {
  it('it should return a health string', (done) => {
    chai.request(server).get("/health").end((err, res) => {
        res.should.have.status(200);
        done();
        // res.body.should.be.a('string');
    });
  });
});
