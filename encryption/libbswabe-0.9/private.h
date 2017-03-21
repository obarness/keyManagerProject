 
/*
	Include glib.h, pbc.h, and bswabe.h before including this file.
*/
/*
 * This header file hold all the algorithm's structures which inclued
 * the keys and the cipher-text.
 */

/*
 * The public key struct.
 * PK = (g^b, (g^b)^2' h^b, e(g,g)^a)
 */
struct bswabe_pub_s
{
	char* pairing_desc;		//the string with the parameters to create the elliptic curve
	pairing_t p;			//the struct with the description
	element_t g;
	element_t n;
	element_t g_b;			
	element_t g_a1;         
	element_t g_a2;		
	element_t g_ba1;			
	element_t g_ba2;			
	element_t tao1;
	element_t tao2;
	element_t tao1_b;
	element_t tao2_b;
	element_t w;
	element_t h;
	element_t pair;			

	//added the following elements in order to support bswabe_enc without using the msk.
	element_t alpha;
	element_t a1;
	element_t a2;
	element_t beta;	

};

/*
 * The master secret key struct
 * MSK = (g, h, a, b, ctr)
 * All the elements in this key are from the group Zp
 */
struct bswabe_msk_s
{
	element_t g;			/*	G1	*/
	element_t g_alpha;
	element_t g_alpha_a1;	        // g^(alpha * a1)
	element_t v;			/*	G1	*/
	element_t v1;
	element_t v2;
	element_t alpha;		/*	Zp */
	element_t beta;			/* 	Zp */
	element_t a1;
	element_t a2;
	
};

typedef struct
{
	/* these actually get serialized */
	char* attr;
	element_t d;  /* G_2 */
	element_t dp; /* G_2 */

	/* only used during dec (only by dec_merge) */
	int used;
	element_t z;  /* G_1 */
	element_t zp; /* G_1 */
}
bswabe_prv_comp_t;

/*
 * The client's private key.
 */
struct bswabe_prv_s
{
	
	element_t d_1;		/* G1 */
	element_t d_2;		/* G1 */
	element_t d_3;		/* G1 */
	element_t d_4;		/* G1 */
	element_t d_5;		/* G1 */
	element_t d_6;		/* G1 */
	element_t d_7;		/* G1 */
	element_t k;

	
};

typedef struct
{
	int deg;
	/* coefficients from [0] x^0 to [deg] x^deg */
	element_t* coef; /* G_T (of length deg + 1) */
}
bswabe_polynomial_t;

typedef struct
{
	/* serialized */
	int k;            /* one if leaf, otherwise threshold */
	char* attr;       /* attribute string if leaf, otherwise null */
	element_t c;      /* G_1, only for leaves */
	element_t cp;     /* G_1, only for leaves */
	GPtrArray* children; /* pointers to bswabe_policy_t's, len == 0 for leaves */

	/* only used during encryption */
	bswabe_polynomial_t* q;

	/* only used during decryption */
	int satisfiable;
	int min_leaves;
	int attri;
	GArray* satl;
}
bswabe_policy_t;

/*
 * This struct hold the part in the cipher-text the associates with the ID attribute.
 */
typedef struct
{
	element_t c_i1;	/* G1 */
	element_t c_i2;	/* G1 */
	element_t id;	/* Zp */
}
ct_attr;

/*
 * The cipher text which is encrypted with the revoke clients' IDs
 */
struct bswabe_cph_s
{
	element_t c_0;	/* GT */
	element_t c_1;	/* G1 */
	element_t c_2;
	element_t c_3;
	element_t c_4;
	element_t c_5;
	element_t c_6;
	element_t c_7;

	GPtrArray* attr;
};