 
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifndef BSWABE_DEBUG
#define NDEBUG
#endif
#include <assert.h>

#include <openssl/sha.h>
#include <glib.h>
#include <pbc.h>

#include "bswabe.h"
#include "private.h"


//this string hold the elliptic curve's parameters
#define TYPE_A_PARAMS \
		"type a\n" \
		"q 87807107996633125224377819847540498158068831994142082" \
		"1102865339926647563088022295707862517942266222142315585" \
		"8769582317459277713367317481324925129998224791\n" \
		"h 12016012264891146079388821366740534204802954401251311" \
		"822919615131047207289359704531102844802183906537786776\n" \
		"r 730750818665451621361119245571504901405976559617\n" \
		"exp2 159\n" \
		"exp1 107\n" \
		"sign1 1\n" \
		"sign0 1\n"

char last_error[256];

char*
bswabe_error()
{
	return last_error;
}

void
raise_error(char* fmt, ...)
{
	va_list args;

#ifdef BSWABE_DEBUG
	va_start(args, fmt);
	vfprintf(stderr, fmt, args);
	va_end(args);
	exit(1);
#else
	va_start(args, fmt);
	vsnprintf(last_error, 256, fmt, args);
	va_end(args);
#endif
}

void
element_from_string( element_t h, char* s )
{
	unsigned char* r;

	r = malloc(SHA_DIGEST_LENGTH);
	SHA1((unsigned char*) s, strlen(s), r);
	element_from_hash(h, r, SHA_DIGEST_LENGTH);

	free(r);
}

void
bswabe_setup(signed long int n, bswabe_pub_t** pub, bswabe_msk_t** msk )
{

	/* initialize */
	*pub = (bswabe_pub_t*) malloc(sizeof(bswabe_pub_t));
	*msk = (bswabe_msk_t*) malloc(sizeof(bswabe_msk_t));

	(*pub)->pairing_desc = strdup(TYPE_A_PARAMS);			//taking the parameters for the group
	pairing_init_set_buf((*pub)->p, (*pub)->pairing_desc, strlen((*pub)->pairing_desc));	//setting the elliptic group

	printf("libbswabe setup - Initializing elements\n");
	/*	public initialization	*/
	element_init_G1((*pub)->g,				(*pub)->p);
	element_init_G1((*pub)->g_b,			(*pub)->p);
	element_init_G1((*pub)->g_a1,			(*pub)->p);
	element_init_G1((*pub)->g_a2,			(*pub)->p);
	element_init_G1((*pub)->g_ba1,			(*pub)->p);
	element_init_G1((*pub)->g_ba2,			(*pub)->p);
	element_init_G1((*pub)->tao1,			(*pub)->p);
	element_init_G1((*pub)->tao2,			(*pub)->p);
	element_init_G1((*pub)->tao1_b,			(*pub)->p);
	element_init_G1((*pub)->tao2_b,			(*pub)->p);
	element_init_G1((*pub)->w,				(*pub)->p);
	element_init_G1((*pub)->h,				(*pub)->p);
	element_init_GT((*pub)->pair,			(*pub)->p);


	/*	msk initialization	*/

	element_init_G1((*msk)->g,					(*pub)->p);
	element_init_G1((*msk)->g_alpha,			(*pub)->p);
	element_init_Zr((*msk)->g_alpha_a1,			(*pub)->p);
	element_init_Zr((*msk)->v,					(*pub)->p);
	element_init_Zr((*msk)->v1,					(*pub)->p);
	element_init_Zr((*msk)->v2,					(*pub)->p);
	element_init_Zr((*msk)->alpha,				(*pub)->p);
	element_init_Zr((*msk)->beta,				(*pub)->p);
	element_init_Zr((*msk)->a1,					(*pub)->p);
	element_init_Zr((*msk)->a2,					(*pub)->p);


	printf("libbswabe setup - Computing key elements\n");
	/*	compute msk	*/

	//random group elements - msk
	element_random((*msk)->g);
	element_random((*msk)->v);
	element_random((*msk)->v1);
	element_random((*msk)->v2);

	//random group elements - pub
	element_random((*pub)->w);
	element_random((*pub)->h);

	// random numbers from Zp
	element_random((*msk)->alpha);
	element_random((*msk)->beta);
	element_random((*msk)->a1);
	element_random((*msk)->a2);

	/* assign all msk fields */


	element_pow_zn((*msk)->g_alpha,			(*pub)->g, 		(*msk)->alpha);	//g^b

	element_t alpha_a1;
	element_mul   	(alpha_a1,	(*msk)->alpha,			(*msk)->a1); 	//alpha * a1
	element_pow_zn((*msk)->g_alpha_a1,			(*pub)->g, 		alpha_a1);	//g^(alpha*a1)
	element_set   ((*msk)->pub,			pub);

	/*	compute pub	*/

	element_set   ((*pub)->g,			(*msk)->g); 
	element_set_si((*pub)->n,			n);  
	element_pow_zn((*pub)->g_b,			(*pub)->g, 		(*msk)->beta);	//g^b
	element_pow_zn((*pub)->g_a1,		(*pub)->g, 		(*msk)->a1);	//g^a1
	element_pow_zn((*pub)->g_a2,			(*pub)->g, 		(*msk)->a2);	//g^a2

	/* assign g_ba1 */
	element_t ba1;
	element_mul   	(ba1,	(*msk)->beta,			(*msk)->a1); 	//b*a1
	element_pow_zn((*pub)->g_ba1,			(*pub)->g, 		ba1);	//g^ba1
	/* assign g_ba2 */
	element_t ba2;
	element_mul   	(ba2,	(*msk)->beta,			(*msk)->a2); 	//b*a2
	element_pow_zn((*pub)->g_ba2,			(*pub)->g, 		ba2;	//g^ba2

	/* assignment of tao1_b & tao1 */
	element_t v1_a1;
	element_init_Zr	(v1_a1,			(*pub)->p );
	element_pow_zn	(v1_a1,			(*msk)->v1, 		(*msk)->a1);	//v1^a1
	element_mul   	((*pub)->tao1,	(*msk)->v,			v1_a1); // tao1 = v * v^a1;
	element_pow_zn((*pub)->tao1_b,			(*pub)->tao1, 		(*msk)->beta);	//tao1^b

	/* assignment of tao2_b & tao2 */
	element_t v2_a2;
	element_init_Zr	(v2_a2,			(*pub)->p );
	element_pow_zn	(v2_a2,			(*msk)->v2, 		(*msk)->a2);	//v2^a2
	element_mul   	((*pub)->tao2,	(*msk)->v,			v2_a2); // tao1 = v * v^a2;
	element_pow_zn((*pub)->tao2_b,			(*pub)->tao2, 		(*msk)->beta);	//tao2^b

	//create alpha * a1 * beta
	element_t a1_beta;
	element_mul   	(a1_beta,	(*msk)->a1,			(*msk)->beta); // tao1 = v * v^a1;
	//create g alpha*a1*beta
	element_t alpha_a1_beta;
	element_mul   	(alpha_a1_beta,	a1_beta,			(*msk)->alpha); // tao1 = v * v^a1;

	element_t g_alpha_a1_beta;
	element_pow_zn(g_alpha_a1_beta,			(*pub)->g, 		alpha_a1_beta);	//g^alpha_a1_beta
	/* apply eliptic curve elements */
	pairing_apply((*pub)->pair,			(*pub)->g,		alpha_a1_beta,	(*pub)->p);	//e(g,g)^alpha*a1*beta

	pairing_apply((*pub)->pair,			(*msk)->g,		g_alpha_a1_beta,	(*pub)->p);	//e(g,g)^a
	//clear unneeded elements
	element_clear(ba1);
	element_clear(ba2);
	element_clear(v1_a1);
	element_clear(v2_a2);
	element_clear(a1_beta);
	element_clear(alpha_a1_beta);
	element_clear(g_alpha_a1_beta);
	element_clear(alpha_a1);


	printf ("libbswabe setup - Print elements for debugging\n");
	printf("Print MSK:\n");
	element_printf("g:\t%B\n", 		(*msk)->g);
	element_printf("h:\t%B\n", 		(*msk)->h);
	element_printf("alpha:\t%B\n", 	(*msk)->alpha);
	element_printf("beta:\t%B\n", 	(*msk)->beta);
	element_printf("CTR:\t%B\n", 	(*msk)->ctr);
	printf("\nPrint PK:\n");
	element_printf("g:\t%B\n", 		(*pub)->g);
	element_printf("g_b:\t%B\n", 	(*pub)->g_b);
	element_printf("g_b_sqr:%B\n",	(*pub)->g_b_sqr);
	element_printf("h_b:\t%B\n", 	(*pub)->h_b);
	element_printf("pair:\t%B\n", 	(*pub)->pair);
}

bswabe_prv_t* bswabe_keygen(bswabe_msk_t* msk, long id_value )
{
	/*	Declarations	*/
	bswabe_prv_t* prv;			//pointer to private key

	/*	d_0	*/
	element_t g_a;			/* G1 */
	element_t g_b_2_t;		/* G1 */

	/*	d_1	*/
	element_t g_b_id;		/* G1 */
	element_t g_mul_h;		/* G1 */

	/*	d_2	*/
	element_t t_minus;		/* Zp */


	/*	d_3	*/

	/*	d_4	*/

	/*	d_5	*/

	/*	d_6	*/

	/*	d_7	*/

	/*	e	*/
	element_t g_ctr;		/* G1 */
	/*	Local elements	*/
	element_t t;			/* Zp */
	element_t id;			/* Zp */

	printf ("libbswabe keygen - Initializing elements\n");
	/* initialize */
	prv = (bswabe_prv_t*) malloc(sizeof(bswabe_prv_t));		//private key allocation

	/* key element initialization	*/
	element_init_G1	(prv->d_0,	pub->p);
	element_init_G1	(prv->d_1,	pub->p);
	element_init_G1	(prv->d_2,	pub->p);
	element_init_GT	(prv->e, 	pub->p);
	/*	local element initialization */
	element_init_Zr	(id,			pub->p);
	element_init_Zr	(t,			pub->p);
	/* d_0 element initialization	*/
	element_init_G1	(g_a,		pub->p);
	element_init_G1	(g_b_2_t,	pub->p);
	/* d_1 element initialization	*/
	element_init_G1	(g_b_id, 	pub->p);
	element_init_G1	(g_mul_h, 	pub->p);
	/* d_2 element initialization	*/
	element_init_Zr	(t_minus,	pub->p);
	/* e element initialization	*/
	element_init_G1	(g_ctr,		pub->p);

	printf ("libbswabe keygen - Computing key elements\n");
	/*	compute	*/
	element_set_si 	(id, 		id_value);
	element_random	(t);
	/*	d_0	compute	*/
	element_pow_zn	(g_a,		msk->g,			msk->alpha);		//g^a
	element_pow_zn	(g_b_2_t, 	pub->g_b_sqr, 	t);					//g^(t*b^2)
	element_mul   	(prv->d_0,	g_a,			g_b_2_t);			//D0 = g^a * g^(t*b^2)
	/*	d_1	compute	*/
	element_pow_zn	(g_b_id,	pub->g_b,		id);
	element_mul   	(g_mul_h,	g_b_id,			msk->h);
	element_pow_zn	(prv->d_1,	g_mul_h,		t);					//D1 = (g^(b*ID) * h)^t
	/*	d_2	compute	*/
	element_neg   	(t_minus,	t);
	element_pow_zn	(prv->d_2,	msk->g,			t_minus);			//D2 = g^(-t)
	/*	e compute	*/
	element_pow_zn	(g_ctr,		msk->g,			msk->ctr);
	pairing_apply 	(prv->e,	g_ctr,			g_b_2_t,	pub->p);//E = e(g,g)^(CTR*t*b^2)
	/*	clear unneeded elements	*/
	element_clear	(g_a);
	element_clear	(g_b_2_t);
	element_clear	(g_b_id);
	element_clear	(g_mul_h);
	element_clear	(t_minus);
	element_clear	(g_ctr);
	element_clear	(t);
	element_clear	(id);

	printf("\nPrint SK:\n");
	element_printf("D0:\t%B\n", prv->d_0);
	element_printf("D1:\t%B\n", prv->d_1);
	element_printf("D2:\t%B\n", prv->d_2);
	element_printf("E:\t%B\n", 	prv->e);

	return prv;
}

bswabe_policy_t*
base_node( int k, char* s )
{
	bswabe_policy_t* p;

	p = (bswabe_policy_t*) malloc(sizeof(bswabe_policy_t));
	p->k = k;
	p->attr = s ? strdup(s) : 0;
	p->children = g_ptr_array_new();
	p->q = 0;

	return p;
}



bswabe_policy_t*
parse_policy_postfix( char* s )
{
	char** toks;
	char** cur_toks;
	char*  tok;
	GPtrArray* stack; /* pointers to bswabe_policy_t's */
	bswabe_policy_t* root;

	toks     = g_strsplit(s, " ", 0);
	cur_toks = toks;
	stack    = g_ptr_array_new();

	while( *cur_toks )
	{
		int i, k, n;

		tok = *(cur_toks++);

		if( !*tok )
			continue;

		if( sscanf(tok, "%dof%d", &k, &n) != 2 )
			/* push leaf token */
			g_ptr_array_add(stack, base_node(1, tok));
		else
		{
			bswabe_policy_t* node;

			/* parse "kofn" operator */

			if( k < 1 )
			{
				raise_error("error parsing \"%s\": trivially satisfied operator \"%s\"\n", s, tok);
				return 0;
			}
			else if( k > n )
			{
				raise_error("error parsing \"%s\": unsatisfiable operator \"%s\"\n", s, tok);
				return 0;
			}
			else if( n == 1 )
			{
				raise_error("error parsing \"%s\": identity operator \"%s\"\n", s, tok);
				return 0;
			}
			else if( n > stack->len )
			{
				raise_error("error parsing \"%s\": stack underflow at \"%s\"\n", s, tok);
				return 0;
			}

			/* pop n things and fill in children */
			node = base_node(k, 0);
			g_ptr_array_set_size(node->children, n);
			for( i = n - 1; i >= 0; i-- )
				node->children->pdata[i] = g_ptr_array_remove_index(stack, stack->len - 1);

			/* push result */
			g_ptr_array_add(stack, node);
		}
	}

	if( stack->len > 1 )
	{
		raise_error("error parsing \"%s\": extra tokens left on stack\n", s);
		return 0;
	}
	else if( stack->len < 1 )
	{
		raise_error("error parsing \"%s\": empty policy\n", s);
		return 0;
	}

	root = g_ptr_array_index(stack, 0);

	g_strfreev(toks);
	g_ptr_array_free(stack, 0);

	return root;
}

bswabe_polynomial_t*
rand_poly( int deg, element_t zero_val )
{
	int i;
	bswabe_polynomial_t* q;

	q = (bswabe_polynomial_t*) malloc(sizeof(bswabe_polynomial_t));
	q->deg = deg;
	q->coef = (element_t*) malloc(sizeof(element_t) * (deg + 1));

	for( i = 0; i < q->deg + 1; i++ )
		element_init_same_as(q->coef[i], zero_val);

	element_set(q->coef[0], zero_val);

	for( i = 1; i < q->deg + 1; i++ )
		element_random(q->coef[i]);

	return q;
}

void
eval_poly( element_t r, bswabe_polynomial_t* q, element_t x )
{
	int i;
	element_t s, t;

	element_init_same_as(s, r);
	element_init_same_as(t, r);

	element_set0(r);
	element_set1(t);

	for( i = 0; i < q->deg + 1; i++ )
	{
		/* r += q->coef[i] * t */
		element_mul(s, q->coef[i], t);
		element_add(r, r, s);

		/* t *= x */
		element_mul(t, t, x);
	}

	element_clear(s);
	element_clear(t);
}

void
fill_policy( bswabe_policy_t* p, bswabe_pub_t* pub, element_t e )
{
	int i;
	element_t r;
	element_t t;
	element_t h;

	element_init_Zr(r, pub->p);
	element_init_Zr(t, pub->p);
	element_init_G2(h, pub->p);

	p->q = rand_poly(p->k - 1, e); //generate polynom

	if( p->children->len == 0 )
	{
		element_init_G1(p->c,  pub->p);
		element_init_G2(p->cp, pub->p);

		element_from_string(h, p->attr);
//		element_pow_zn(p->c,  pub->g, p->q->coef[0]);
		element_pow_zn(p->cp, h,      p->q->coef[0]);
	}
	else
		for( i = 0; i < p->children->len; i++ )
		{
			element_set_si(r, i + 1);
			eval_poly(t, p->q, r);
			fill_policy(g_ptr_array_index(p->children, i), pub, t);
		}

	element_clear(r);
	element_clear(t);
	element_clear(h);
}

/*
 * This function creates the last part in the CT that depends on the number of revoke clients.
 * It takes the string with all the ids from the input, divides them and create the proper elements.
 * It also breaks down the random exponents S to r parts, when r is the number of ids, such that S1+...Sr = S.
 */
void
setId ( bswabe_pub_t* pub, char* rawAttrString, element_t s, GPtrArray * root)
{
	printf("\nsetId - the input string:\t%s\n", rawAttrString);
	element_printf("S:\t%B\n", s);
	char** idArray;
	char** currentId;
	char* stringId;

	element_t s_i;		//Si is a part from the exponent S
	element_t s_i_sum;	//the sum of r-1 Si		in total S1+...+Sr = S

	idArray = g_strsplit(rawAttrString, " ", 0);	//split the whole rawAttrString string with the delimiter " "
	currentId = idArray;

	element_init_Zr(s_i, 		pub->p);
	element_init_Zr(s_i_sum, 	pub->p);

	element_set0(s_i_sum);		//initialize the s sum to 0
	element_printf("initial sum:\t%B\n", s_i_sum);

	int counter = 0;

	while (*currentId)								//while there is still ids left
	{
		counter++;									//only for debug printing

		stringId = *(currentId++);					//get the current individual id

		ct_attr* p;									//a pointer to the new ct_attr struct that will be build
		p = (ct_attr*) malloc(sizeof(ct_attr));		//allocate the size of the new part of the CT

		/*	initialize */
		element_init_G1(p->c_i1,	pub->p);
		element_init_G1(p->c_i2,	pub->p);
		element_init_Zr(p->id,		pub->p);

		/*	compute	*/
		element_set_si (p->id,		atoi(stringId));//set an id element from string
		element_printf("\nRevoke id %i:\t%B\n", counter, p->id);

		printf("setId - creating the struct with the ID's\n");
		if (*(currentId) == NULL )					//if this is the last id we need to calculate Sr
		{
			if (counter == 1)						//this means that the first id is the only id and that S doesn't need to be divided
			{
				element_set(s_i,	s);				//set Si to be S
				element_printf("S1. counter %i:\t%B\n", counter, s_i);
			}
			else
			{
				element_sub(s_i,	s,		s_i_sum);	//to create the r part do Sr = S - sum(Si) mod p
				element_printf("Sr. counter %i:\t%B\n", counter, s_i);
			}
		}
		else
		{
			element_random (s_i);
			element_printf("Si. counter %i:\t%B\n", counter, s_i);
			element_add    (s_i_sum,	s_i_sum,	s_i);
			element_printf("Si sum. counter %i:\t%B\n", counter, s_i_sum);
		}
		element_t g_b_2_id;		/* G1 */
		element_t g_mul_h;		/* G1 */

		element_init_G1(g_b_2_id,	pub->p);
		element_init_G1(g_mul_h,	pub->p);

		element_pow_zn(p->c_i1,		pub->g_b,		s_i);		//c1 = g^(b*s_i)
		element_printf("C%i1:\t%B\n",counter, p->c_i1);
		element_pow_zn(g_b_2_id, 	pub->g_b_sqr,	p->id);
		element_mul   (g_mul_h,		g_b_2_id, 		pub->h_b);
		element_pow_zn(p->c_i2,		g_mul_h,		s_i);		//c2 = (g^(id*b^2) * h^b)^s_i
		element_printf("C%i2:\t%B\n",counter, p->c_i2);
		element_clear(g_b_2_id);
		element_clear(g_mul_h);

		g_ptr_array_add(root,p);								//after the part of the CT was constructed it's added to the pointer array
		printf("New root length is: %d\n", root->len);
	}

	element_clear(s_i);
	element_clear(s_i_sum);
}

/*
 * the encryption function first of all encrypts the message M but also updates the
 * master key's current state CTR.
 */
bswabe_cph_t*
bswabe_enc(bswabe_pub_t* pub, bswabe_msk_t* msk, unsigned char* msg, char* inputIdString)
{
	printf("\nlibbswabe enc - Revoke ids: %s\n",inputIdString);
	bswabe_cph_t* cph;

	element_t s;		/* Zp */	//the random exponent
	element_t m;		/* GT */	//the message M
	element_t cs_pair;	/* GT */

	/* initialize */
	cph = (bswabe_cph_t*) malloc(sizeof(bswabe_cph_t));

	element_init_GT	(m, 		pub->p);
	element_init_Zr	(s, 		pub->p);
	/* init C~ */
	element_init_GT	(cs_pair,	pub->p);
	element_init_GT	(cph->c_s, 	pub->p);
	/* init C0 */
	element_init_G1	(cph->c_0,  pub->p);

	/* convert message */
	printf("string before:\t%s\n", 	msg);
	element_from_bytes(m, 		msg);						//convert the file's content to an element

	/* preform update */
	element_random	(s);
	element_printf("S:\t%B\n",s);
	element_add   	(msk->ctr,	s,			msk->ctr);	//update the new state new CTR = s2
	element_printf("CTR:\t%B\n",msk->ctr);

	/* compute C~ */
	element_pow_zn	(cs_pair,	pub->pair,	msk->ctr);
	element_mul   	(cph->c_s,	cs_pair,	m);		//c~ = e(g,g)^(a*S2)*M
	element_printf("c_s:\t%B\n",cph->c_s);
	/*	compute c_0	*/
	element_pow_zn	(cph->c_0,	msk->g,		msk->ctr);
	element_printf("c_0:\t%B\n",cph->c_0);

	/*	compute attribute elements	*/
	cph->attr = g_ptr_array_new();		//initialize attr as a new array
	setId(pub ,inputIdString, s , cph->attr);

	/* debug */
	printf("debugging - the attribute array has id's number: %d \n", cph->attr->len);
	printf("print CT:\n");
	element_printf("C~:\t%B\n", 		cph->c_s);
	element_printf("C0:\t%B\n", 		cph->c_0);
	int i;
	for (i = 0 ; i < cph->attr->len ; i++)
	{
		ct_attr * ctAtt = (ct_attr*) g_ptr_array_index(cph->attr, i);
		printf("printing group element number: %d\n",i);
		element_printf("id %i:\t%B\n", i+1, ctAtt->id);
		element_printf("C%i1:\t%B\n", i+1, ctAtt->c_i1);
		element_printf("C%i2:\t%B\n", i+1, ctAtt->c_i2);
	}

	element_clear(s);
	element_clear(m);

	printf("libbswabe-enc - Returning to cpabe-enc\n");
	return cph;
//	return NULL;
}

void
check_sat( bswabe_policy_t* p, bswabe_prv_t* prv )
{
	int i, l;

	p->satisfiable = 0;
	if( p->children->len == 0 )
	{
//		for( i = 0; i < prv->comps->len; i++ )
//			if( !strcmp(g_array_index(prv->comps, bswabe_prv_comp_t, i).attr,
//					p->attr) )
//			{
//				p->satisfiable = 1;
//				p->attri = i;
//				break;
//			}
	}
	else
	{
		for( i = 0; i < p->children->len; i++ )
			check_sat(g_ptr_array_index(p->children, i), prv);

		l = 0;
		for( i = 0; i < p->children->len; i++ )
			if( ((bswabe_policy_t*) g_ptr_array_index(p->children, i))->satisfiable )
				l++;

		if( l >= p->k )
			p->satisfiable = 1;
	}
}

void
pick_sat_naive( bswabe_policy_t* p, bswabe_prv_t* prv )
{
	int i, k, l;

	assert(p->satisfiable == 1);

	if( p->children->len == 0 )
		return;

	p->satl = g_array_new(0, 0, sizeof(int));

	l = 0;
	for( i = 0; i < p->children->len && l < p->k; i++ )
		if( ((bswabe_policy_t*) g_ptr_array_index(p->children, i))->satisfiable )
		{
			pick_sat_naive(g_ptr_array_index(p->children, i), prv);
			l++;
			k = i + 1;
			g_array_append_val(p->satl, k);
		}
}


bswabe_policy_t* cur_comp_pol;
int
cmp_int( const void* a, const void* b )
{
	int k, l;

	k = ((bswabe_policy_t*) g_ptr_array_index(cur_comp_pol->children, *((int*)a)))->min_leaves;
	l = ((bswabe_policy_t*) g_ptr_array_index(cur_comp_pol->children, *((int*)b)))->min_leaves;

	return
			k <  l ? -1 :
					k == l ?  0 : 1;
}

void
pick_sat_min_leaves( bswabe_policy_t* p, bswabe_prv_t* prv )
{
	int i, k, l;
	int* c;

	assert(p->satisfiable == 1);

	if( p->children->len == 0 )
		p->min_leaves = 1;
	else
	{
		for( i = 0; i < p->children->len; i++ )
			if( ((bswabe_policy_t*) g_ptr_array_index(p->children, i))->satisfiable )
				pick_sat_min_leaves(g_ptr_array_index(p->children, i), prv);

		c = alloca(sizeof(int) * p->children->len);
		for( i = 0; i < p->children->len; i++ )
			c[i] = i;

		cur_comp_pol = p;
		qsort(c, p->children->len, sizeof(int), cmp_int);

		p->satl = g_array_new(0, 0, sizeof(int));
		p->min_leaves = 0;
		l = 0;

		for( i = 0; i < p->children->len && l < p->k; i++ )
			if( ((bswabe_policy_t*) g_ptr_array_index(p->children, c[i]))->satisfiable )
			{
				l++;
				p->min_leaves += ((bswabe_policy_t*) g_ptr_array_index(p->children, c[i]))->min_leaves;
				k = c[i] + 1;
				g_array_append_val(p->satl, k);
			}
		assert(l == p->k);
	}
}

void
lagrange_coef( element_t r, GArray* s, int i )
{
	int j, k;
	element_t t;

	element_init_same_as(t, r);

	element_set1(r);
	for( k = 0; k < s->len; k++ )
	{
		j = g_array_index(s, int, k);
		if( j == i )
			continue;
		element_set_si(t, - j);
		element_mul(r, r, t); /* num_muls++; */
		element_set_si(t, i - j);
		element_invert(t, t);
		element_mul(r, r, t); /* num_muls++; */
	}

	element_clear(t);
}

void
dec_leaf_naive( element_t r, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	bswabe_prv_comp_t* c;
	element_t s;

//	c = &(g_array_index(prv->comps, bswabe_prv_comp_t, p->attri));

	element_init_GT(s, pub->p);

	pairing_apply(r, p->c,  c->d,  pub->p); /* num_pairings++; */
	pairing_apply(s, p->cp, c->dp, pub->p); /* num_pairings++; */
	element_invert(s, s);
	element_mul(r, r, s); /* num_muls++; */

	element_clear(s);
}

void dec_node_naive( element_t r, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub );

void
dec_internal_naive( element_t r, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	int i;
	element_t s;
	element_t t;

	element_init_GT(s, pub->p);
	element_init_Zr(t, pub->p);

	element_set1(r);
	for( i = 0; i < p->satl->len; i++ )
	{
		dec_node_naive
		(s, g_ptr_array_index
				(p->children, g_array_index(p->satl, int, i) - 1), prv, pub);
		lagrange_coef(t, p->satl, g_array_index(p->satl, int, i));
		element_pow_zn(s, s, t); /* num_exps++; */
		element_mul(r, r, s); /* num_muls++; */
	}

	element_clear(s);
	element_clear(t);
}

void
dec_node_naive( element_t r, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	assert(p->satisfiable);
	if( p->children->len == 0 )
		dec_leaf_naive(r, p, prv, pub);
	else
		dec_internal_naive(r, p, prv, pub);
}

void
dec_naive( element_t r, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	dec_node_naive(r, p, prv, pub);
}

void
dec_leaf_merge( element_t exp, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	bswabe_prv_comp_t* c;
	element_t s;

//	c = &(g_array_index(prv->comps, bswabe_prv_comp_t, p->attri));

	if( !c->used )
	{
		c->used = 1;
		element_init_G1(c->z,  pub->p);
		element_init_G1(c->zp, pub->p);
		element_set1(c->z);
		element_set1(c->zp);
	}

	element_init_G1(s, pub->p);

	element_pow_zn(s, p->c, exp); /* num_exps++; */
	element_mul(c->z, c->z, s); /* num_muls++; */

	element_pow_zn(s, p->cp, exp); /* num_exps++; */
	element_mul(c->zp, c->zp, s); /* num_muls++; */

	element_clear(s);
}

void dec_node_merge( element_t exp, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub );

void
dec_internal_merge( element_t exp, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	int i;
	element_t t;
	element_t expnew;

	element_init_Zr(t, pub->p);
	element_init_Zr(expnew, pub->p);

	for( i = 0; i < p->satl->len; i++ )
	{
		lagrange_coef(t, p->satl, g_array_index(p->satl, int, i));
		element_mul(expnew, exp, t); /* num_muls++; */
		dec_node_merge(expnew, g_ptr_array_index
				(p->children, g_array_index(p->satl, int, i) - 1), prv, pub);
	}

	element_clear(t);
	element_clear(expnew);
}

void
dec_node_merge( element_t exp, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	assert(p->satisfiable);
	if( p->children->len == 0 )
		dec_leaf_merge(exp, p, prv, pub);
	else
		dec_internal_merge(exp, p, prv, pub);
}

void
dec_merge( element_t r, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	int i;
	element_t one;
	element_t s;

	/* first mark all attributes as unused */
//	for( i = 0; i < prv->comps->len; i++ )
//		g_array_index(prv->comps, bswabe_prv_comp_t, i).used = 0;

	/* now fill in the z's and zp's */
	element_init_Zr(one, pub->p);
	element_set1(one);
	dec_node_merge(one, p, prv, pub);
	element_clear(one);

	/* now do all the pairings and multiply everything together */
	element_set1(r);
	element_init_GT(s, pub->p);
//	for( i = 0; i < prv->comps->len; i++ )
//		if( g_array_index(prv->comps, bswabe_prv_comp_t, i).used )
//		{
//			bswabe_prv_comp_t* c = &(g_array_index(prv->comps, bswabe_prv_comp_t, i));
//
//			pairing_apply(s, c->z, c->d, pub->p); /* num_pairings++; */
//			element_mul(r, r, s); /* num_muls++; */
//
//			pairing_apply(s, c->zp, c->dp, pub->p); /* num_pairings++; */
//			element_invert(s, s);
//			element_mul(r, r, s); /* num_muls++; */
//		}
	element_clear(s);
}

void
dec_leaf_flatten( element_t r, element_t exp,
		bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	bswabe_prv_comp_t* c;
	element_t s;
	element_t t;

//	c = &(g_array_index(prv->comps, bswabe_prv_comp_t, p->attri));

	element_init_GT(s, pub->p);
	element_init_GT(t, pub->p);

	pairing_apply(s, p->c,  c->d,  pub->p); /* num_pairings++; */
	pairing_apply(t, p->cp, c->dp, pub->p); /* num_pairings++; */
	element_invert(t, t);
	element_mul(s, s, t); /* num_muls++; */
	element_pow_zn(s, s, exp); /* num_exps++; */

	element_mul(r, r, s); /* num_muls++; */

	element_clear(s);
	element_clear(t);
}

void dec_node_flatten( element_t r, element_t exp,
		bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub );

void
dec_internal_flatten( element_t r, element_t exp,
		bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	int i;
	element_t t;
	element_t expnew;

	element_init_Zr(t, pub->p);
	element_init_Zr(expnew, pub->p);

	for( i = 0; i < p->satl->len; i++ )
	{
		lagrange_coef(t, p->satl, g_array_index(p->satl, int, i));
		element_mul(expnew, exp, t); /* num_muls++; */
		dec_node_flatten(r, expnew, g_ptr_array_index
				(p->children, g_array_index(p->satl, int, i) - 1), prv, pub);
	}

	element_clear(t);
	element_clear(expnew);
}

void
dec_node_flatten( element_t r, element_t exp,
		bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	assert(p->satisfiable);
	if( p->children->len == 0 )
		dec_leaf_flatten(r, exp, p, prv, pub);
	else
		dec_internal_flatten(r, exp, p, prv, pub);
}

void
dec_flatten( element_t r, bswabe_policy_t* p, bswabe_prv_t* prv, bswabe_pub_t* pub )
{
	element_t one;

	element_init_Zr(one, pub->p);

	element_set1(one);
	element_set1(r);

	dec_node_flatten(r, one, p, prv, pub);

	element_clear(one);
}
/*
 * The decryption part of the algorithm which cipher the original message and alsom perform an update in
 * the client's state E in it's secret key.
 */
char*
bswabe_dec( bswabe_pub_t* pub, bswabe_prv_t* prv, bswabe_cph_t* cph, long id_value)
{
	int i = 0;

	element_t numerator;		/* GT */
	element_t denominator;		/* GT */
//	element_t update;			/* GT */
	element_t c_1_temp;			/* G1 */
	element_t c_2_temp;			/* G1 */
	element_t c_1_mul;			/* G1 */
	element_t c_2_mul;			/* G1 */
	element_t a;				/* GT */
	element_t a_1;				/* GT */
	element_t a_2;				/* GT */
	element_t id;				/* Zp */
	element_t idInvert;			/* Zp */
	element_t msg;				/* GT */

	ct_attr* temp;
	char* message = 0;

	/* initialization */

	element_init_GT(numerator,		pub->p);
	element_init_GT(denominator,	pub->p);
//	element_init_GT(update,			pub->p);
	element_init_G1(c_1_temp,		pub->p);
	element_init_G1(c_2_temp,		pub->p);
	element_init_G1(c_1_mul,		pub->p);
	element_init_G1(c_2_mul,		pub->p);
	element_init_GT(a,				pub->p);
	element_init_GT(a_1,			pub->p);
	element_init_GT(a_2,			pub->p);
	element_init_Zr(id,				pub->p);
	element_init_Zr(idInvert,		pub->p);
	element_init_GT(msg,			pub->p);

	/*	checking the ids	*/
	element_set_si(id,				id_value);

	for (i = 0; i < cph->attr->len; i++)
	{
		temp = (ct_attr*) g_ptr_array_index(cph->attr, i);
		element_printf("libbswabe-dec - Compairing between\nclient id:\t%B\nrevoke id:\t%B\n",id, temp->id);
		if (element_cmp(id, temp->id) == 0)
		{
//			perror("The ids match. the algorithm can't decrypted\n");
			return 0;
		}
		else
		{
			printf("ids doesn't match.\t CONTINUE\n");
		}
	}
	temp = NULL;
	i = 0;

	/*	computing	*/
	//computing the element A = A1 * A2
	for (i = 0; i < cph->attr->len; i++)
	{
		temp = (ct_attr*) g_ptr_array_index(cph->attr, i);
		element_t idSub;	/* Zp */
		element_init_Zr(idSub, 		pub->p);
		element_sub   (idSub,		id,			temp->id);
		element_printf("Id sub:\t%B\n", idSub);
		element_invert(idInvert,	idSub);
		element_printf("Id invert:\t%B\n", idInvert);
		element_clear(idSub);

		if (i == 0)
		{
			printf("Calculating element %d\n", i+1);
			// calc C1
			element_pow_zn(c_1_mul,		temp->c_i1,		idInvert);
			element_printf("C%i1:\t%B\n",i+1, c_1_mul);
			// calc C2
			element_pow_zn(c_2_mul,		temp->c_i2,		idInvert);
			element_printf("C%i2:\t%B\n",i+1, c_2_mul);
		}
		else
		{
			printf("Calculating element %d\n", i+1);
			// calc C1
			element_pow_zn(c_1_temp,	temp->c_i1,		idInvert);
			element_printf("C%i1:\t%B\n",i+1, c_1_temp);
			element_mul   (c_1_mul,		c_1_mul,		c_1_temp);
			element_printf("C%i1 mul:\t%B\n",i+1, c_1_mul);
			// calc C2
			element_pow_zn(c_2_temp,	temp->c_i2,		idInvert);
			element_printf("C%i2:\t%B\n",i+1, c_2_temp);
			element_mul   (c_2_mul,		c_2_mul,		c_2_temp);
			element_printf("C%i2 mul:%B\n",i+1, c_2_mul);
		}
	}
	printf("doing pairing\n");
	pairing_apply(a_1,			prv->d_1,		c_1_mul,	pub->p);
	element_printf("A1:\t%B\n",a_1);
	pairing_apply(a_2,			prv->d_2,		c_2_mul,	pub->p);
	element_printf("A2:\t%B\n",a_2);
	element_mul  (a,			a_1,			a_2);		//A = A1 * A2
	element_printf("A:\t%B\n",a);
	element_printf("libbswabe-dec - element A:\n%B\n", a);

	element_mul(prv->e, 		prv->e, 		a);			//E <- E * A the state update
	element_printf("SK state:\t%B", prv->e);

	element_mul(numerator,		cph->c_s,		prv->e);
	pairing_apply(denominator,	cph->c_0,		prv->d_0,	pub->p);

	element_div(msg,			numerator, 		denominator);

	message = malloc(element_length_in_bytes(msg));
	element_to_bytes(message, msg);
	printf("the message is:\t\t%s\n", message);

	return message;
}
