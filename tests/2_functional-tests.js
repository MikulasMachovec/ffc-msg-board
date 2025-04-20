const chai = require('chai')
const chaiHttp = require('chai-http');;
const assert = chai.assert;
const server = require('../server');
const res = require('express/lib/response');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    suite('Thread tests', ()=>{
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
                
                const boardRes = await chai.request(server)
                    .get(`/api/threads/${board}`);
                const thread = boardRes.body.find(t => t.text ==='Delete_me');
                if(thread) testThreadId = thread._id    

            });
            test('DELETE with incorrect password', ()=>{
                chai.request(server)
                .delete(`/api/threads/${board}`)
                .send({
                    thread_id: testThreadId,
                    delete_password: 'wrong_pass'
                })
                .end((err,res) => {
                    assert.equal(res.status, 200)
                    assert.equal(res.text, 'incorrect password')
                })
            });
            // Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
            test('DELETE with correct password', () =>{
            chai.request(server)
                .delete(`/api/threads/${board}`)
                .send({
                    thread_id: testThreadId,
                    delete_password: 'be_gone'
                })
                .end((err,res)=>{
                    assert.equal(res.status, 200)
                    assert.equal(res.text, 'success')
                })
            })
        })
        suite('Reporting thread',()=>{
            const board = 'report_n_reply'

            before(async()=>{
                await chai.request(server)
                .post(`/api/threads/${board}`)
                .send({
                    text: 'Report_me',
                    delete_password: 'toxic' 
                });
                
                const boardRes = await chai.request(server)
                    .get(`/api/threads/${board}`);
                const thread = boardRes.body.find(t => t.text ==='Report_me');
                if(thread) testThreadId = thread._id    
            });
            // Reporting a thread: PUT request to /api/threads/{board}
            test('PUT request for report thread',()=>{
                chai.request(server)
                .put(`/api/threads/${board}`)
                .send({
                    thread_id: testThreadId
                })
                .end((err,res)=>{
                    assert.equal(res.status,200)
                    assert.equal(res.text, 'reported')
                })
            });
        })
    })
    
    suite('Reply tests',()=>{
        const board = 'reply_test_board'
        let testThreadId
        let testReplyId
        before(async()=>{
            await chai.request(server)
            .post(`/api/threads/${board}/`)
            .send({
                text: 'Reply_me',
                delete_password: 'dont' 
            });
            
            const boardRes = await chai.request(server)
                .get(`/api/threads/${board}`);
            const thread = boardRes.body.find(t => t.text ==='Reply_me');
            if(thread) testThreadId = thread._id
            
            await chai.request(server)
            .post(`/api/replies/${board}`)
            .send({
                thread_id: testThreadId,
                text: 'report_n_delete_me',
                delete_password: 'erase'
            })
            const replyRes = await chai.request(server)
                .get(`/api/replies/${board}/`)
                .query({thread_id: testThreadId})
            const reply = replyRes.body.replies.find(r => r.text ==='report_n_delete_me');
            if(reply) testReplyId = reply._id
        });
        // Creating a new reply: POST request to /api/replies/{board}
        test('POST request for reply creating', (done)=>{
            chai.request(server)
            .post(`/api/replies/${board}/`)
            .set('x-test-mode', true)
            .send({
                thread_id: testThreadId,
                text: 'test_reply',
                delete_password: 'test_rep_pass'
            })
            .redirects(0)
            .end((err,res)=>{
                assert.equal(res.status, 200)
                assert.property(res.body, 'replies')
                
                assert.isArray(res.body.replies)
                assert.isAtLeast(res.body.replies.length, 1)

                done()
            })
        })
        // Viewing a single thread with all replies: GET request to /api/replies/{board}
        test('GET single thread with all replies', (done)=>{
            chai.request(server)
                .get(`/api/replies/${board}`)
                .query({
                    thread_id: testThreadId
                })
                .end((err,res)=>{
                    assert.equal(res.status,200)
                    assert.property(res.body, '_id')
                    assert.property(res.body, 'text')
                    assert.equal(res.body._id, testThreadId)
                    assert.property(res.body, 'created_on')
                    assert.property(res.body, 'bumped_on')
                    assert.isObject(res.body, 'replies')
                    done()
                })
        })
        
        // Reporting a reply: PUT request to /api/replies/{board}
        test('PUT reporting reply',(done)=>{
            chai.request(server)
                .put(`/api/replies/${board}/`)
                .send({
                    thread_id: testThreadId,
                    reply_id : testReplyId
                })
                .end((err,res)=>{
                    assert.equal(res.status,200)
                    assert.equal(res.text, 'reported')
                    done()
                })
        })
        
        // Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
        test('DELETE reply with incorrect password',(done)=>{
            chai.request(server)
                .delete(`/api/replies/${board}/`)
                .send({
                    thread_id: testThreadId,
                    reply_id: testReplyId,
                    delete_password: 'wrong_pass'
                })
                .end((err,res)=>{
                    assert.equal(res.status, 200)
                    assert.equal(res.text, 'incorrect password')
                    done()
                })
        })
        
        // Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
        test('DELETE reply with correct password',(done)=>{
            chai.request(server)
                .delete(`/api/replies/${board}/`)
                .send({
                    thread_id: testThreadId,
                    reply_id: testReplyId,
                    delete_password: 'erase'
                })
                .end((err,res)=>{
                    assert.equal(res.status, 200)
                    assert.equal(res.text, 'success')
                    done()
                })
        })
    })
    
});
