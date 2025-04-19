const chai = require('chai')
const chaiHttp = require('chai-http');;
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    // Creating a new thread: POST request to /api/threads/{board}
    test('Creating a new thread', (done)=>{
        chai.request(server)
            .post('/api/threads/functional-test')
            .send({ 
                text: 'test', 
                delete_password: 'delete'
            })

            .end((err,res) =>{
                assert.equal(res.status, 200)
                assert.match(res.redirects, /\/b\/functional-test/)
                done()
            })
    })
    // Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
    suite('GET /api/threads/{board}', ()=>{
        const board = 'functional-test-get-thread'

        before(async()=>{
            for(let i = 0; i < 11; i++){
                await chai.request(server)
                .post(`/api/threads/${board}`)
                .send({
                    text: `Test_thread_${i}`,
                    delete_password: 'pass'
                });
            }
        });

        test('Viewing the 10 most recent threads', done =>{
            chai.request(server)
                .get(`/api/threads/${board}`)
                .end((err, res) =>{
                    assert.equal(res.status, 200)
                    assert.isArray(res.body)
                    assert.isAtMost(res.body.length, 10)

                    res.body.forEach(thread => {
                        assert.property(thread, '_id');
                        assert.property(thread, 'text');
                        assert.property(thread, 'created_on');
                        assert.property(thread, 'bumped_on');
                        assert.property(thread, 'replies');
                        assert.property(thread, 'replycount');

                        assert.isArray(thread.replies);
                        assert.isAtMost(thread.replies.length, 3);

                        assert.notProperty(thread, 'delete_password');
                        assert.notProperty(thread, 'reported');

                        thread.replies.forEach(reply =>{
                            assert.property(reply, '_id');
                            assert.property(reply, 'text');
                            assert.property(reply, 'created_on');

                            assert.notProperty(reply, 'delete_password');
                            assert.notProperty(reply, 'reported');
                        });
                    });
                done();    
                });
        });

    });
    // Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
    suite('DELETE tests for /api/threads/{board}', ()=>{
        const board = 'functional-test-for-delete'

        before(async()=>{
            await chai.request(server)
            .post(`/api/threads/${board}`)
            .send({
                text: 'Delete_me',
                delete_password: 'be_gone' 
            });
        });
        test('DELETE with incorrect password', ()=>{
            chai.request(server)
            .delete(`/api/threads/${board}`)
            .send({})
        })
    })

    
    // Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
    // Reporting a thread: PUT request to /api/threads/{board}
    // Creating a new reply: POST request to /api/replies/{board}
    // Viewing a single thread with all replies: GET request to /api/replies/{board}
    // Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
    // Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
    // Reporting a reply: PUT request to /api/replies/{board}
});
