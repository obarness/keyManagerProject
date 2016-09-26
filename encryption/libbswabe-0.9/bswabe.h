/*
  Include glib.h and pbc.h before including this file. Note that this
  file should be included at most once.
*/

#if defined (__cplusplus)
extern "C" {
#endif

/*
  A public key.
*/
typedef struct bswabe_pub_s bswabe_pub_t;

/*
  A master secret key.
*/
typedef struct bswabe_msk_s bswabe_msk_t;

/*
  A private key.
*/
typedef struct bswabe_prv_s bswabe_prv_t;

/*
  A ciphertext is compiled from the revoked clients' ids. The algorithm choose a random exponent S.
  S is updated to S2 when S2 = S + CTR   mod p. is the new state in the server which is CTR (S2=CTR).
  The CT split S to r different parts according to the number of revoked clients.
  sum(Si) = S for i = 1,...,r.
*/
typedef struct bswabe_cph_s bswabe_cph_t;

/*
  Generate a public key and corresponding master secret key, and
  assign the *pub and *msk pointers to them. The space used may be
  later freed by calling bswabe_pub_free(*pub) and
  bswabe_msk_free(*msk).
*/
void bswabe_setup( bswabe_pub_t** pub, bswabe_msk_t** msk );

/*
  Generate a private key with the given id.
*/
bswabe_prv_t* bswabe_keygen( bswabe_msk_t* msk,
                             long id_value );

/*
  the encryption part picks a random exponent "s" from the group. next it updates the system's
  state in the master key with the operation CTR = CTR + s mod p. the exponent "s" will be
  broken  down to r parts so that sum(Si) = S for i = 1,...,r where r is the number of ids that
  can be found in the string "inputIdString".
  the message "msg" that will be encrypted first converted to an element_t form and then incorparated
  to the cipher-text.
*/
bswabe_cph_t* bswabe_enc(bswabe_pub_t* pub, bswabe_msk_t* msk, unsigned char* msg, char* inputIdString);

/*
  Decrypt the specified ciphertext using the given private key and the client's id.
  A decryption can only work properly if the client id doesn't match the encryption policy.
  The end result is the encrypted message.
*/
char* bswabe_dec( bswabe_pub_t* pub, bswabe_prv_t* prv, bswabe_cph_t* cph, long id_value );

/*
  Convert the structures to a stream of bytes.
*/
GByteArray* bswabe_pub_serialize( bswabe_pub_t* pub );
GByteArray* bswabe_msk_serialize( bswabe_msk_t* msk );
GByteArray* bswabe_prv_serialize( bswabe_prv_t* prv );
GByteArray* bswabe_cph_serialize( bswabe_cph_t* cph );

/*
  Convert the byte stream to the form of a structure.
*/
bswabe_pub_t* bswabe_pub_unserialize( GByteArray* b, int free );
bswabe_msk_t* bswabe_msk_unserialize( bswabe_pub_t* pub, GByteArray* b, int free );
bswabe_prv_t* bswabe_prv_unserialize( bswabe_pub_t* pub, GByteArray* b, int free );
bswabe_cph_t* bswabe_cph_unserialize( bswabe_pub_t* pub, GByteArray* b, int free );

/*
  Deallocate the structures from the memory.
*/
void bswabe_pub_free( bswabe_pub_t* pub );
void bswabe_msk_free( bswabe_msk_t* msk );
void bswabe_prv_free( bswabe_prv_t* prv );
void bswabe_cph_free( bswabe_cph_t* cph );

/*
  Return a description of the last error that occured. Call this after
  bswabe_enc or bswabe_dec returns 0. The returned string does not
  need to be free'd.
*/
char* bswabe_error();

#if defined (__cplusplus)
} // extern "C"
#endif
