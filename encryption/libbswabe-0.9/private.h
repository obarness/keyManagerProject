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
	element_t g;			/* G1 */
	element_t g_b;          /* G1 */
	element_t g_b_sqr;		/* G1 */
	element_t h_b;			/* G1 */
	element_t pair;			/* GT */
};

/*
 * The master secret key struct
 * MSK = (g, h, a, b, ctr)
 * All the elements in this key are from the group Zp
 */
struct bswabe_msk_s
{
	element_t g;			/*	G1	*/
	element_t h;			/*	G1	*/
	element_t alpha;		/*	Zp */
	element_t beta;			/* 	Zp */
	element_t ctr;			/* 	Zp */
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
	element_t d_0;		/* G1 */
	element_t d_1;		/* G1 */
	element_t d_2;		/* G1 */
	element_t e;		/* GT */
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
	element_t c_s;	/* GT */
	element_t c_0;	/* G1 */
	GPtrArray* attr;
};
