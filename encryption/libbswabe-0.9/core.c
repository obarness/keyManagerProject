 
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
// -p pubkey -m masterkey
void
bswabe_setup( bswabe_pub_t** pub, bswabe_msk_t** msk )
{
	signed long int n=2; //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<meanwhile
	/* initialize */
	*pub = (bswabe_pub_t*) malloc(sizeof(bswabe_pub_t));
	*msk = (bswabe_msk_t*) malloc(sizeof(bswabe_msk_t));

	(*pub)->pairing_desc = strdup(TYPE_A_PARAMS);			//taking the parameters for the group
	pairing_init_set_buf((*pub)->p, (*pub)->pairing_desc, strlen((*pub)->pairing_desc));	//setting the elliptic group

	printf("libbswabe setup - Initializing elements\n");
	/*	public initialization	*/
	
	
	element_t alpha_a1;
	element_t ba1;
	element_t ba2;
	element_t v1_a1;
	element_t v2_a2;
	element_t a1_beta;
	element_t alpha_a1_beta;
	element_t g_alpha_a1_beta;
	
	element_init_G1((*pub)->g,			(*pub)->p);
	element_init_G1((*pub)->g_b,			(*pub)->p);
	element_init_G1((*pub)->g_a1,			(*pub)->p);
	element_init_G1((*pub)->g_a2,			(*pub)->p);
	element_init_G1((*pub)->g_ba1,			(*pub)->p);
	element_init_G1((*pub)->g_ba2,			(*pub)->p);
	element_init_G1((*pub)->tao1,			(*pub)->p);
	element_init_G1((*pub)->tao2,			(*pub)->p);
	element_init_G1((*pub)->tao1_b,			(*pub)->p);
	element_init_G1((*pub)->tao2_b,			(*pub)->p);
	element_init_G1((*pub)->w,			(*pub)->p);
	element_init_G1((*pub)->h,			(*pub)->p);
	element_init_GT((*pub)->pair,			(*pub)->p);
	
	element_init_Zr((*pub)->n,			(*pub)->p);
	element_init_Zr(alpha_a1,			(*pub)->p);
	element_init_Zr(ba1,				(*pub)->p);
	element_init_Zr(ba2,				(*pub)->p);
	element_init_G1(v1_a1,				(*pub)->p);
	element_init_G1(v2_a2,				(*pub)->p);
	element_init_Zr(a1_beta,			(*pub)->p);
	element_init_Zr(alpha_a1_beta,			(*pub)->p);
	element_init_G1(g_alpha_a1_beta,		(*pub)->p);

	



	/*	msk initialization	*/

	element_init_G1((*msk)->g,				(*pub)->p);
	element_init_G1((*msk)->g_alpha,			(*pub)->p);
	element_init_G1((*msk)->g_alpha_a1,			(*pub)->p);
	element_init_G1((*msk)->v,				(*pub)->p);
	element_init_G1((*msk)->v1,				(*pub)->p);
	element_init_G1((*msk)->v2,				(*pub)->p);

	element_init_Zr((*msk)->alpha,				(*pub)->p);
	element_init_Zr((*msk)->beta,				(*pub)->p);
	element_init_Zr((*msk)->a1,				(*pub)->p);
	element_init_Zr((*msk)->a2,				(*pub)->p);
	
	
	
	

	printf("libbswabe setup - Computing key elements\n");
	/*	compute msk	*/
        
	//random group elements - msk
	element_random((*msk)->g);
	element_set   ((*pub)->g,			(*msk)->g);
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
	element_pow_zn((*msk)->g_alpha,			(*msk)->g, 		(*msk)->alpha);	//g^alpha
	element_mul   	(alpha_a1,			(*msk)->alpha,		(*msk)->a1); 	//alpha * a1
	element_pow_zn((*msk)->g_alpha_a1,		(*msk)->g, 		alpha_a1);	//g^(alpha*a1)	
			
	/*	compute pub	*/
	element_set_si((*pub)->n,			n);  
	element_pow_zn((*pub)->g_b,				(*pub)->g, 		(*msk)->beta);	//g^b
	element_pow_zn((*pub)->g_a1,			(*pub)->g, 		(*msk)->a1);	//g^a1
	element_pow_zn((*pub)->g_a2,			(*pub)->g, 		(*msk)->a2);	//g^a2
	
	/* assign g_ba1 */
	element_mul   	(ba1,				(*msk)->beta,		(*msk)->a1); 	//b*a1
	element_pow_zn	((*pub)->g_ba1,			(*pub)->g, 		ba1);	//g^ba1
	/* assign g_ba2 */
	element_mul   	(ba2,				(*msk)->beta,		(*msk)->a2); 	//b*a2
	element_pow_zn((*pub)->g_ba2,			(*pub)->g, 		ba2);	//g^ba2

	/* assignment of tao1_b & tao1 */
	element_pow_zn	(v1_a1,				(*msk)->v1, 		(*msk)->a1);	//v1^a1
	element_mul   	((*pub)->tao1,			(*msk)->v,		v1_a1); // tao1 = v * v^a1;
	element_pow_zn	((*pub)->tao1_b,		(*pub)->tao1, 		(*msk)->beta);	//tao1^b

	/* assignment of tao2_b & tao2 */
	
	element_pow_zn	(v2_a2,				(*msk)->v2, 		(*msk)->a2);	//v2^a2
	element_mul   	((*pub)->tao2,			(*msk)->v,		v2_a2); // tao1 = v * v^a2;
	element_pow_zn((*pub)->tao2_b,			(*pub)->tao2, 		(*msk)->beta);	//tao2^b
	
	//create alpha * a1 * beta
	element_mul   	(a1_beta,			(*msk)->a1,		(*msk)->beta);
	
	//create g alpha*a1*beta
	element_mul   	(alpha_a1_beta,			(*msk)->alpha,		a1_beta);                          // tao1 = v * v^a1;
	
	element_pow_zn	(g_alpha_a1_beta,		(*pub)->g, 		alpha_a1_beta);	//g^alpha_a1_beta
	
	
	/* apply eliptic curve elements */
	//pairing_apply((*pub)->pair,			(*pub)->g,		alpha_a1_beta,		(*pub)->p);	//e(g,g)^alpha*a1*beta
	pairing_apply((*pub)->pair,			(*msk)->g,		g_alpha_a1_beta,	(*pub)->p);	//e(g,g)^alpha_a1_beta

	
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
	element_printf("g_alpha:\t%B\n", 	(*msk)->g_alpha);
	element_printf("g_alpha_a1:\t%B\n", 	(*msk)->g_alpha_a1);
	element_printf("v:\t%B\n", 		(*msk)->v);
	element_printf("v1:\t%B\n", 		(*msk)->v1);
	element_printf("v2:\t%B\n", 		(*msk)->v2);
	element_printf("alpha:\t%B\n", 		(*msk)->alpha);
	element_printf("beta:\t%B\n", 		(*msk)->beta);
	element_printf("a1:\t%B\n", 		(*msk)->a1);
	element_printf("a2:\t%B\n", 		(*msk)->a2);
	printf("\nPrint PK:\n");
	element_printf("g:\t%B\n", 		(*pub)->g);
	element_printf("g_b:\t%B\n", 		(*pub)->g_b);
	element_printf("g_a1:%B\n", 		(*pub)->g_a1);
	element_printf("g_a2:\t%B\n", 		(*pub)->g_a2);
	element_printf("g_ba1:\t%B\n", 		(*pub)->g_ba1);
	element_printf("g_ba2:\t%B\n", 		(*pub)->g_ba2);
	element_printf("tao1:\t%B\n", 		(*pub)->tao1);
	element_printf("tao2:\t%B\n", 		(*pub)->tao2);
	element_printf("w:\t%B\n", 		(*pub)->w);
	element_printf("h:\t%B\n", 		(*pub)->h);
	element_printf("pair:\t%B\n", 		(*pub)->pair);
	
}

bswabe_prv_t* bswabe_keygen(bswabe_pub_t** pub, bswabe_msk_t** msk, long id_value)
{
	/*	Declarations	*/
	bswabe_prv_t* prv;			//pointer to private key

	
	/*	d_1	*/
	element_t g_alpha_a1;			/* G1 */
	element_t v_d;		     		/* G1 */
	/*	d_2	*/
	element_t g_minusalpha;		
	element_t v1_d;
	element_t g_z1;
	/*	d_3	*/
	element_t g_b_minusz1;	
	/*	d_4	*/
	element_t v2_d;
	element_t g_z2;	
	/*	d_5	*/
	element_t g_b_minusz2;
	/*	d_6	*/
	element_t g_d2_b;
	/*	d_7	*/
	element_t g_d1;
	/*	K	*/
	element_t w_id_h_d1;
	
	/*	Local elements	*/
	element_t id;			/* Zp */
	element_t d;			
	element_t d1;			/* Zp */
	element_t d2;			/* Zp */	
	element_t z1;			/* Zp */
	element_t z2;			/* Zp */
	element_t minusapha;
	element_t minusz1;
	element_t minusz2;
	element_t d2Beta;
	

    
	printf ("libbswabe keygen - Initializing elements\n");
	/* initialize */
	prv = (bswabe_prv_t*) malloc(sizeof(bswabe_prv_t));		//private key allocation

	/* key element initialization	*/
	element_init_G1	(prv->d_1,	(*pub)->p);
	element_init_G1	(prv->d_2,	(*pub)->p);
	element_init_G1	(prv->d_3,	(*pub)->p);
	element_init_G1	(prv->d_4,	(*pub)->p);
	element_init_G1	(prv->d_5,	(*pub)->p);
	element_init_G1	(prv->d_6,	(*pub)->p);
	element_init_G1	(prv->d_7,	(*pub)->p);
	element_init_G1	(prv->k,	(*pub)->p);
	/*	local element initialization */
	element_init_Zr	(id,		(*pub)->p);
	element_init_Zr	(d,			(*pub)->p);
	element_init_Zr	(d1,		(*pub)->p);
	element_init_Zr	(d2,		(*pub)->p);
	element_init_Zr	(z1,		(*pub)->p);
	element_init_Zr	(z2,		(*pub)->p);
	element_init_Zr	(minusapha,	(*pub)->p);
	element_init_Zr	(minusz1,	(*pub)->p);
	element_init_Zr	(minusz2,	(*pub)->p);
	element_init_Zr	(d2Beta,		(*pub)->p);
	/* d_1 element initialization	*/
	element_init_G1	(g_alpha_a1,	(*pub)->p);
	element_init_G1	(v_d,		(*pub)->p);
	/* d_2 element initialization	*/
	element_init_G1	(g_minusalpha, 	(*pub)->p);
	element_init_G1	(v1_d, 	 	(*pub)->p);
	element_init_G1	(g_z1, 		(*pub)->p);
	/* d_3 element initialization	*/
	element_init_G1	(g_b_minusz1,	(*pub)->p);
	/* d_4 element initialization	*/
	element_init_G1	(v2_d,		(*pub)->p);
	element_init_G1	(g_z2,		(*pub)->p);
	/* d_5 element initialization	*/
	element_init_G1	(g_b_minusz2,	(*pub)->p);
	/* d_6 element initialization	*/
	element_init_G1	(g_d2_b,	(*pub)->p);
	/* d_7 element initialization	*/
	element_init_G1	(g_d1,		(*pub)->p);
	/* k element initialization	*/
	element_init_G1	(w_id_h_d1,	(*pub)->p);

	
	
	printf ("libbswabe keygen - Computing key elements\n");
	/*	compute	*/
	element_set_si 	(id, 		id_value);
	element_random	(d1);
	element_random	(d2);
	element_random	(z1);
	element_random	(z2);
	element_add     (d,			d1,			d2);
	
	/*	d_1	compute	*/
	element_pow_zn	(v_d,		(*msk)->v,		d);			//v^d
	element_mul   	(prv->d_1,	(*msk)->g_alpha_a1,	v_d);			//D1 = (g^alpha*a1)*(v^d)


	/*	d_2	compute	*/
	element_neg   	(minusapha,	(*msk)->alpha);
	element_pow_zn	(g_minusalpha,	(*msk)->g,		minusapha);
	element_pow_zn	(v1_d,		(*msk)->v1,		d);			  
	element_pow_zn	(g_z1,		(*msk)->g,		z1);
	element_mul     (prv->d_2,	g_minusalpha,		v1_d);
	element_mul     (prv->d_2,	prv->d_2,		g_z1);		//D2 = (g^-alpha)*(v1^d)*(g^z1)
	
	
	/*	d_3	compute	*/
	element_neg   	(minusz1,	z1);
	element_pow_zn	(g_b_minusz1,	(*pub)->g_b,		minusz1);		
	element_set     (prv->d_3,	g_b_minusz1);					//D3 = (g^b)^-z1
	
	/*	d_4	compute	*/
	element_pow_zn	(v2_d,		(*msk)->v2,		d);
	element_pow_zn	(g_z2,		(*msk)->g,		z2);
	element_mul     (prv->d_4,	v2_d,			g_z2);			//D4 = (v2^d)*(g^z2)
	
	/*	d_5	compute	*/
	element_neg   	(minusz2,	z2);
	element_pow_zn	(g_b_minusz2,	(*pub)->g_b,		minusz2);		
	element_set     (prv->d_5,	g_b_minusz2);					//D5 = (g^b)^-z2
	/*	d_6	compute	*/

	element_mul	(d2Beta,		d2,           (*msk)->beta);
	element_pow_zn	(prv->d_6,	(*pub)->g,		d2Beta);	

	/*	d_7	compute	*/
	element_pow_zn	(g_d1,		(*pub)->g,		d1);		
	element_set     (prv->d_7,	g_d1);						//D7 = (g^d1)
	/*	K	compute	*/
	element_pow_zn	(w_id_h_d1,	(*pub)->w,		id);	
	element_mul     (w_id_h_d1,	w_id_h_d1,		(*pub)->h);		
	element_pow_zn	(prv->k,	w_id_h_d1,		d1);			//K = (h*w^id)^d1
	

	
	
	/*	clear unneeded elements	*/
	element_clear (g_alpha_a1);			
	element_clear (v_d);		     		
	element_clear (g_minusalpha);		
	element_clear (v1_d);
	element_clear (g_z1);
	element_clear (g_b_minusz1); 
	element_clear (v2_d);
	element_clear (g_z2);
	element_clear (g_b_minusz2);
	element_clear (g_d2_b);
	element_clear (g_d1);
	element_clear (w_id_h_d1);
	element_clear (id);			
	element_clear (d);			
	element_clear (d1);		
	element_clear (d2);			
	element_clear (z1);			
	element_clear (z2);		
	element_clear (minusapha);
	element_clear (minusz1);
	element_clear (minusz2);
	
	
	

	printf("\nPrint SK:\n");
	element_printf("D1:\t%B\n", prv->d_1);
	element_printf("D2:\t%B\n", prv->d_2);
	element_printf("D3:\t%B\n", prv->d_3);
	element_printf("D4:\t%B\n", prv->d_4);
	element_printf("D5:\t%B\n", prv->d_5);
	element_printf("D6:\t%B\n", prv->d_6);
	element_printf("D7:\t%B\n", prv->d_7);
	element_printf("K:\t%B\n",  prv->k);

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
setId ( bswabe_pub_t* pub, char* rawAttrString, element_t s, GPtrArray * root, element_t* neg_t)
{
	printf("\nsetId - the input string:\t%s\n", rawAttrString);
	element_printf("S:\t%B\n", s);
	char** idArray;
	char** currentId;
	char* stringId;

	element_t t_i;		//Si is a part from the exponent S
	element_t t_i_sum;	//the sum of r-1 Si		in total S1+...+Sr = S

	idArray = g_strsplit(rawAttrString, " ", 0);	//split the whole rawAttrString string with the delimiter " "
	currentId = idArray;

	element_init_Zr(t_i, 		pub->p);
	element_init_Zr(t_i_sum, 	pub->p);

	element_set0(t_i_sum);		//initialize the s sum to 0
	element_printf("initial sum:\t%B\n", t_i_sum);

	int counter = 0;

	while (*currentId)								//while there is still ids left
	{
		counter++;									//only for debug printing

		stringId = *(currentId++);					//get the current individual id

		ct_attr* p;									//a pointer to the new ct_attr struct that will be build
		p = (ct_attr*) malloc(sizeof(ct_attr));		//allocate the size of the new part of the CT

		//initialize 
		element_init_G1(p->c_i1,	pub->p);
		element_init_G1(p->c_i2,	pub->p);
		element_init_Zr(p->id,		pub->p);

		//compute
		element_set_si (p->id,		atoi(stringId));//set an id element from string
		element_printf("\nRevoke id %i:\t%B\n", counter, p->id);

		printf("setId - creating the struct with the ID's\n");

		element_random (t_i);
		element_printf("Si. counter %i:\t%B\n", counter, t_i);
		element_add    (t_i_sum,	t_i_sum,	t_i);
		element_printf("Si sum. counter %i:\t%B\n", counter, t_i_sum);
		
		//element_t g_t_i;		// G1 
		//element_t w_id_h;		// G1 

		//element_init_G1(g_t_i,	pub->p);
		//element_init_G1(w_id_h,	pub->p);

		/***** C i,1 *****/
		element_pow_zn(p->c_i1,		pub->g,		t_i);		
		element_printf("C%i1:\t%B\n",counter, p->c_i1);

		/***** C i,2 *****/
		element_pow_zn(p->c_i2, 	pub->w,	p->id);
		element_mul   (p->c_i2,		p->c_i2, 		pub->h);
		element_pow_zn(p->c_i2,		p->c_i2,		t_i);
		element_printf("C%i2:\t%B\n",counter, p->c_i2);


		//element_clear(g_t_i);
		//element_clear(w_id_h);

		g_ptr_array_add(root,p);								//after the part of the CT was constructed it's added to the pointer array
		printf("New root length is: %d\n", root->len);
	}
	printf("set_id is clearing elements before returning...\n");
	element_clear(t_i);
	printf("trying to set negative t\n");
	element_set(*neg_t,	t_i_sum);
	element_printf("*t_i_sum:\t%B\n",t_i_sum);
	element_printf("*neg_t:\t%B\n",*neg_t);
	printf("done\n");
	element_clear(t_i_sum);

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
	cph = (bswabe_cph_t*) malloc(sizeof(bswabe_cph_t));
	

	element_t s;		/* Zp */	//the random exponent
	element_t s1;
	element_t s2;
	element_t neg_t;
	element_t m;		/* GT */	//the message M


	

	element_init_GT	(m, 		pub->p);
	element_init_Zr	(s, 		pub->p);
	element_init_Zr	(s1, 		pub->p);
	element_init_Zr	(s2, 		pub->p);

	/* convert message */
	
	printf("string before:\t%s\n", 	msg);
	element_from_bytes (m, 		msg);						//convert the file's content to an element
	//unsigned char* msg2 = (unsigned char*) malloc(element_length_in_bytes(msg));
	unsigned char* message2 = 0;
	message2 =(unsigned char*) malloc(element_length_in_bytes(m));
	element_to_bytes(message2, m);
	printf("The message after is:\t\t%s\n", message2);
	//element_to_bytes(msg2,   	 m);
	//printf("string afterrrrrr:\t%s\n", 	msg2);
	
// 	char* signed_message = (char*) msg2;
// 	printf("The message original is:\t\t%s\n", signed_message);

	/**** calculate randoms ****/
	element_random(s1);
	element_printf("S1:\t%B\n",s1);
	element_random(s2);
	element_printf("S2:\t%B\n",s2);
	element_add(s, s1, s2);
	element_printf("S:\t%B\n",s);

/***** c_0 *****/
	printf("creating element c_0...\n");

	element_init_GT		(cph->c_0, 		pub->p);
	element_t alpha_a1_beta;
	element_t g_alpha_a1_beta;
	element_init_G1		(g_alpha_a1_beta, 	pub->p);
	element_init_Zr		(alpha_a1_beta, 	pub->p);

	element_mul		(alpha_a1_beta,		msk->alpha,		msk->a1);    //alpha * a1
	element_mul		(alpha_a1_beta,		alpha_a1_beta,		msk->beta);  //(alpha*a1) * beta
	element_pow_zn		(g_alpha_a1_beta,   	msk->g,			alpha_a1_beta);

	pairing_apply		(cph->c_0,		msk->g,			g_alpha_a1_beta, 	pub->p); //apply pairing
	element_pow_zn		(cph->c_0,		cph->c_0,		s2);						 //apply power
	element_mul   		(cph->c_0,		m,			cph->c_0);	
							//multiply
	element_clear		(alpha_a1_beta);

	printf("done\n");
/***** c_1 *****/
	printf("creating element c_1...\n");
	element_init_G1		(cph->c_1,  			pub->p);
	element_set     	(cph->c_1,			msk->g);
	element_pow_zn		(cph->c_1, 	cph->c_1, 	msk->beta);
	element_pow_zn		(cph->c_1, 	cph->c_1, 	s);
	printf("done\n");
/***** c2 *****/
	printf("creating element c_2...\n");
	element_t b_a1;
	element_init_Zr (b_a1,					  pub->p);
	element_mul		(b_a1, 		msk->beta,   msk->a1);

	element_init_G1	(cph->c_2,  			pub->p);
	element_set     (cph->c_2,			  msk->g);
	element_pow_zn	(cph->c_2, cph->c_2, 		b_a1);
	element_pow_zn	(cph->c_2, cph->c_2, 		s1);

	element_clear(b_a1);
	printf("done\n");
/***** c3 *****/
	printf("creating element c_3...\n");
	element_init_G1	(cph->c_3,  			pub->p);
	element_set     (cph->c_3,			msk->g);
	element_pow_zn	(cph->c_3, 	cph->c_3, 	msk->a1);
	element_pow_zn	(cph->c_3, 	cph->c_3, 	s1);
	printf("done\n");
/***** c4 *****/
	printf("creating element c_4...\n");
	element_t b_a2;
	element_init_Zr (b_a2,					  pub->p);
	element_mul		(b_a2, 		msk->beta,   msk->a2);

	element_init_G1	(cph->c_4,  			pub->p);
	element_set     (cph->c_4,			   msk->g);
	element_pow_zn	(cph->c_4, cph->c_4, 		b_a2);
	element_pow_zn	(cph->c_4, cph->c_4, 		s2);

	element_clear(b_a2);
	printf("done\n");
/***** c5 *****/
	printf("creating element c_5...\n");
	element_init_G1	(cph->c_5,  			pub->p);
	element_set     (cph->c_5,			   msk->g);
	element_pow_zn	(cph->c_5, cph->c_5, 		msk->a2);
	element_pow_zn	(cph->c_5, cph->c_5, 		s2);
	printf("done\n");
/***** c6 *****/
	printf("creating element c_6...\n");
	element_init_G1	(cph->c_6,  			pub->p);

	element_t tao1_s1;
	element_t tao2_s2;
	element_init_G1	(tao1_s1,  					pub->p);
	element_init_G1	(tao2_s2,  					pub->p);
	element_pow_zn	(tao1_s1, 	pub->tao1, 		s1);
	element_pow_zn	(tao2_s2, 	pub->tao2, 		s2);
	element_mul     (cph->c_6,	tao1_s1,		tao2_s2);

	element_clear(tao1_s1);
	element_clear(tao2_s2);
	printf("done\n");
/***** c_7 *****/
	printf("creating element c_7...\n");
	cph->attr = g_ptr_array_new();		//initialize attr as a new array

	element_init_Zr	(neg_t,  					pub->p);
	(setId(pub ,inputIdString, s , cph->attr, &neg_t));
	element_printf("*neg_t:\t%B\n",neg_t);
	element_neg(neg_t, neg_t);
	
	element_init_G1	(cph->c_7,  			pub->p);

	element_t tao1_beta_s1;
	element_t tao2_beta_s2;
	element_t w_neg_t;

	element_init_G1	(tao1_beta_s1,  					pub->p);
	element_init_G1	(tao2_beta_s2,  					pub->p);
	element_init_G1	(w_neg_t,  							pub->p);

	element_pow_zn	(tao1_beta_s1, 	pub->tao1, 		msk->beta);
	element_pow_zn	(tao1_beta_s1, 	tao1_beta_s1, 		s1);

	element_pow_zn	(tao2_beta_s2, 	pub->tao2, 		msk->beta);
	element_pow_zn	(tao2_beta_s2, 	tao2_beta_s2, 		s2);


	// TODO: calculate negative t and apply power.
	element_pow_zn	(w_neg_t, 	pub->w, 		neg_t);

	// ***********8 multiply all three elements.
	element_mul(cph->c_7, 	tao1_beta_s1, 		tao2_beta_s2);
	element_mul(cph->c_7, 	cph->c_7,			w_neg_t);

	element_clear(tao1_beta_s1);
	element_clear(tao2_beta_s2);
	element_clear(w_neg_t);
	element_clear(neg_t);
	printf("done\n");


	

	/* debug */
	printf("debugging - the attribute array has id's number: %d \n", cph->attr->len);
	printf("print CT:\n");
	element_printf("C0:\t%B\n", 		cph->c_0);
	/* debug */
	int i;
	for (i = 0 ; i < cph->attr->len ; i++)
	{
		ct_attr * ctAtt = (ct_attr*) g_ptr_array_index(cph->attr, i);
		printf("printing group element number: %d\n",i);
		element_printf("id %i:\t%B\n", i+1, ctAtt->id);
		element_printf("C%i1:\t%B\n", i+1, ctAtt->c_i1);
		element_printf("C%i2:\t%B\n", i+1, ctAtt->c_i2);
	}


	printf("libbswabe-enc - Returning to cpabe-enc\n");
	
	printf("\nPrint SK After:\n");
	element_printf("c_0:\t%B\n", cph->c_0);
	element_printf("c_1:\t%B\n", cph->c_1);
	element_printf("c_2:\t%B\n", cph->c_2);
	element_printf("c_3:\t%B\n", cph->c_3);
	element_printf("c_4:\t%B\n", cph->c_4);
	element_printf("c_5:\t%B\n", cph->c_5);
	element_printf("c_6:\t%B\n", cph->c_6);
	element_printf("c_7:\t%B\n", cph->c_7);

	return cph;

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
	unsigned char* message = 0;
	int i = 0;
	ct_attr* temp;
	
	
	element_t numerator;			/* GT */
	element_t denominator;			/* GT */
//	element_t update;			/* GT */
	element_t c_1_temp;			/* G1 */
	element_t c_2_temp;			/* G1 */
	element_t c_1_mul;			/* G1 */
	element_t c_2_mul;			/* G1 */
	element_t a;				/* GT */
	element_t a_1;				/* GT */
	element_t a_11;
	element_t a_12;
	element_t a_13;
	element_t a_14;
	element_t a_15;
	element_t a_2;				/* GT */
	element_t a_21;				
	element_t a_3;				/* GT */
	element_t a_4;				/* GT */
	element_t id;				/* Zp */
	element_t msg;				/* GT */


	/* initialization */
	element_init_GT(numerator,			pub->p);
	element_init_GT(denominator,			pub->p);
//	element_init_GT(update,				pub->p);
	element_init_G1(c_1_temp,			pub->p);
	element_init_G1(c_2_temp,			pub->p);
	element_init_G1(c_1_mul,			pub->p);
	element_init_G1(c_2_mul,			pub->p);
	element_init_GT(a,					pub->p);
	element_init_GT(a_1,				pub->p);
	element_init_GT(a_11,				pub->p);
	element_init_GT(a_12,				pub->p);
	element_init_GT(a_13,				pub->p);
	element_init_GT(a_14,				pub->p);
	element_init_GT(a_15,				pub->p);
	element_init_GT(a_2,				pub->p);
	element_init_GT(a_21,				pub->p);
	element_init_GT(a_3,				pub->p);
	element_init_GT(a_4,				pub->p);
	element_init_Zr(id,				pub->p);
	element_init_GT(msg,				pub->p);

	/*	checking the ids	*/
	element_set_si(id,				id_value);

	for (i = 0; i < cph->attr->len; i++)
	{
		temp = (ct_attr*) g_ptr_array_index(cph->attr, i);
		element_printf("libbswabe-dec - Compairing between\nclient id:\t%B\nrevoke id:\t%B\n",id, temp->id);
		if (element_cmp(id, temp->id) == 0)
		{
			return 0;
		}
		else
		{
			printf("ids doesn't match.\t CONTINUE\n");
		}
	}
	
	
	//Calculate A1	
	pairing_apply(a_11,			cph->c_1,	    prv->d_1,	pub->p);
	pairing_apply(a_12,			cph->c_2,		prv->d_2,	pub->p);
	pairing_apply(a_13,			cph->c_3,		prv->d_3,	pub->p);
	pairing_apply(a_14,			cph->c_4,		prv->d_4,	pub->p);
	pairing_apply(a_15,			cph->c_5,		prv->d_5,	pub->p);	
	element_mul  (a_1,			a_11,			a_12);
	element_mul  (a_1,			a_1,			a_13);
	element_mul  (a_1,			a_1,			a_14);
	element_mul  (a_1,			a_1,			a_15);
	//Calculate A2
	pairing_apply(a_2,			cph->c_6,		prv->d_6,	pub->p);
	pairing_apply(a_21,			cph->c_7,		prv->d_7,	pub->p);
	element_mul  (a_2,			a_2,			a_21);
	//Calculate A3
	element_div(a_3,			a_1, 			a_2);

	temp = NULL;
	//Calculate A4 
	for (i = 0; i < cph->attr->len; i++)
	{

		temp = (ct_attr*) g_ptr_array_index(cph->attr, i);
		element_t idSub;					/* Zp */
		element_t idInvert;					/* Zp */
		element_init_Zr(idSub, 			pub->p);
		element_init_Zr(idInvert,		pub->p);
		element_sub    (idSub,			id,			temp->id);
		element_printf ("Id sub:\t%B\n", 	idSub);
		element_invert (idInvert,		idSub);
		element_printf ("Id invert:\t%B\n", 	idInvert);
		


		
		printf("Calculating element %d\n", i+1);
		element_t a_4temp;				/* GT */
		element_t a_4temp2;				/* GT */
		element_init_GT(a_4temp, 	pub->p);
		element_init_GT(a_4temp2, 	pub->p);
		pairing_apply (a_4temp,		temp->c_i1,		prv->k,		pub->p);
		pairing_apply (a_4temp2,	temp->c_i2,		prv->d_7,		pub->p);
		element_div   (a_4temp,		a_4temp,		a_4temp2);
		element_pow_zn(a_4temp,		a_4temp,		idInvert);
		if(i==0)
		    element_set   (a_4,		a_4temp);
		else
		    element_mul   (a_4,		a_4,			a_4temp);
		
		element_clear (a_4temp);
		element_clear (a_4temp2);
		element_clear (idSub);
		element_clear (idInvert);
			
		
	}
	
	
	element_div   (a,			a_3,			a_4);
	element_div   (msg,			cph->c_0,		a);
	

// 	element_mul(prv->e, 		prv->e, 		a);			//E <- E * A the state update
// 	element_printf("SK state:\t%B", prv->e);

	element_printf("msg:\t%B\n",msg);
	message =(unsigned char*) malloc(element_length_in_bytes(msg));
	element_to_bytes(message, msg);
	printf("The message is:\t\t%s\n", message);

	char* signed_message = (char*) message;
	return signed_message;
}