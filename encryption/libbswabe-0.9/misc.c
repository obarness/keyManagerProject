#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <glib.h>
#include <pbc.h>

#include "bswabe.h"
#include "private.h"

void
serialize_uint32( GByteArray* b, uint32_t k )
{
	int i;
	guint8 byte;

	for( i = 3; i >= 0; i-- )
	{
		byte = (k & 0xff<<(i*8))>>(i*8);
		g_byte_array_append(b, &byte, 1);
	}
}

uint32_t
unserialize_uint32( GByteArray* b, int* offset )
{
	int i;
	uint32_t r;

	r = 0;
	for( i = 3; i >= 0; i-- )
		r |= (b->data[(*offset)++])<<(i*8);

	return r;
}

void
serialize_element( GByteArray* b, element_t e )
{
	uint32_t len;
	unsigned char* buf;

	len = element_length_in_bytes(e);
	serialize_uint32(b, len);

	buf = (unsigned char*) malloc(len);
	element_to_bytes(buf, e);
	g_byte_array_append(b, buf, len);
	free(buf);
}

void
unserialize_element( GByteArray* b, int* offset, element_t e )
{
	uint32_t len;
	unsigned char* buf;

	len = unserialize_uint32(b, offset);

	buf = (unsigned char*) malloc(len);
	memcpy(buf, b->data + *offset, len);
	*offset += len;

	element_from_bytes(e, buf);
	free(buf);
}

void
serialize_string( GByteArray* b, char* s )
{
	g_byte_array_append(b, (unsigned char*) s, strlen(s) + 1);
}

char*
unserialize_string( GByteArray* b, int* offset )
{
	GString* s;
	char* r;
	char c;

	s = g_string_sized_new(32);
	while( 1 )
	{
		c = b->data[(*offset)++];
		if( c && c != EOF )
			g_string_append_c(s, c);
		else
			break;
	}

	r = s->str;
	g_string_free(s, 0);

	return r;
}

GByteArray*
bswabe_pub_serialize( bswabe_pub_t* pub )
{
	GByteArray* b;

	b = g_byte_array_new();
	serialize_string (b,	pub->pairing_desc);
	serialize_element(b,	pub->g);
	serialize_element(b,	pub->g_b);
	serialize_element(b,	pub->g_b_sqr);
	serialize_element(b,	pub->h_b);
	serialize_element(b,	pub->pair);

	return b;
}

bswabe_pub_t*
bswabe_pub_unserialize( GByteArray* b, int free )
{
	bswabe_pub_t* pub;
	int offset;

	pub = (bswabe_pub_t*) malloc(sizeof(bswabe_pub_t));
	offset = 0;

	pub->pairing_desc = unserialize_string(b, &offset);
	pairing_init_set_buf(pub->p, pub->pairing_desc, strlen(pub->pairing_desc));

	element_init_G1(pub->g,			pub->p);
	element_init_G1(pub->g_b,		pub->p);
	element_init_G1(pub->g_b_sqr,		pub->p);
	element_init_G1(pub->h_b,		pub->p);
	element_init_GT(pub->pair,		pub->p);

	unserialize_element(b, &offset, pub->g);
	unserialize_element(b, &offset, pub->g_b);
	unserialize_element(b, &offset, pub->g_b_sqr);
	unserialize_element(b, &offset, pub->h_b);
	unserialize_element(b, &offset, pub->pair);

	if( free )
	{
		g_byte_array_free(b, 1);
	}

	printf("\nPrint PK after reconstruction:\n");
	element_printf("g:\t%B\n", 		pub->g);
	element_printf("g_b:\t%B\n", 	pub->g_b);
	element_printf("g_b_sqr:%B\n", 	pub->g_b_sqr);
	element_printf("h_b:\t%B\n", 	pub->h_b);
	element_printf("h_b:\t%B\n", 	pub->pair);
	return pub;
}

GByteArray*
bswabe_msk_serialize( bswabe_msk_t* msk )
{
	GByteArray* b;
	b = g_byte_array_new();

	serialize_element(b, msk->g);
	serialize_element(b, msk->h);
	serialize_element(b, msk->alpha);
	serialize_element(b, msk->beta);
	serialize_element(b, msk->ctr);

	return b;
}

bswabe_msk_t*
bswabe_msk_unserialize( bswabe_pub_t* pub, GByteArray* b, int free )
{
	bswabe_msk_t* msk;
	int offset;

	msk = (bswabe_msk_t*) malloc(sizeof(bswabe_msk_t));
	offset = 0;

	element_init_G1(msk->g,			pub->p);
	element_init_G1(msk->h,			pub->p);
	element_init_Zr(msk->alpha, 	pub->p);
	element_init_Zr(msk->beta,		pub->p);
	element_init_Zr(msk->ctr,		pub->p);

	unserialize_element(b, &offset, msk->g);
	unserialize_element(b, &offset, msk->h);
	unserialize_element(b, &offset, msk->alpha);
	unserialize_element(b, &offset, msk->beta);
	unserialize_element(b, &offset, msk->ctr);

	if( free )
	{
		g_byte_array_free(b, 1);
	}
	printf("\nPrint MSK after reconstruction:\n");
	element_printf("g:\t%B\n", 		msk->g);
	element_printf("h:\t%B\n", 		msk->h);
	element_printf("alpha:\t%B\n", 	msk->alpha);
	element_printf("beta:\t%B\n", 	msk->beta);
	element_printf("CTR:\t%B\n", 	msk->ctr);

	return msk;
}

GByteArray*
bswabe_prv_serialize( bswabe_prv_t* prv )
{
	GByteArray* b;
	b = g_byte_array_new();

	serialize_element(b, 	prv->d_0);
	serialize_element(b, 	prv->d_1);
	serialize_element(b, 	prv->d_2);
	serialize_element(b, 	prv->e);

	return b;
}

bswabe_prv_t*
bswabe_prv_unserialize( bswabe_pub_t* pub, GByteArray* b, int free )
{
	bswabe_prv_t* prv;
	int offset;

	prv = (bswabe_prv_t*) malloc(sizeof(bswabe_prv_t));
	offset = 0;

	element_init_G1(prv->d_0,	pub->p);
	element_init_G1(prv->d_1,	pub->p);
	element_init_G1(prv->d_2,	pub->p);
	element_init_GT(prv->e,		pub->p);

	unserialize_element(b, &offset, prv->d_0);
	unserialize_element(b, &offset, prv->d_1);
	unserialize_element(b, &offset, prv->d_2);
	unserialize_element(b, &offset, prv->e);

	if( free )
	{
		g_byte_array_free(b, 1);
	}

	printf("\nPrint SK after reconstruction:\n");
	element_printf("D0:\t%B\n", 		prv->d_0);
	element_printf("D1:\t%B\n", 		prv->d_1);
	element_printf("D2:\t%B\n", 		prv->d_2);
	element_printf("E:\t%B\n", 			prv->e);
	return prv;
}

void
serialize_policy( GByteArray* b, bswabe_policy_t* p )
{
	int i;

	serialize_uint32(b, (uint32_t) p->k);

	serialize_uint32(b, (uint32_t) p->children->len);
	if( p->children->len == 0 )
	{
		serialize_string( b, p->attr);
		serialize_element(b, p->c);
		serialize_element(b, p->cp);
	}
	else
		for( i = 0; i < p->children->len; i++ )
			serialize_policy(b, g_ptr_array_index(p->children, i));
}

bswabe_policy_t*
unserialize_policy( bswabe_pub_t* pub, GByteArray* b, int* offset )
{
	int i;
	int n;
	bswabe_policy_t* p;

	p = (bswabe_policy_t*) malloc(sizeof(bswabe_policy_t));

	p->k = (int) unserialize_uint32(b, offset);
	p->attr = 0;
	p->children = g_ptr_array_new();

	n = unserialize_uint32(b, offset);
	if( n == 0 )
	{
		p->attr = unserialize_string(b, offset);
		element_init_G1(p->c,  pub->p);
		element_init_G1(p->cp, pub->p);
		unserialize_element(b, offset, p->c);
		unserialize_element(b, offset, p->cp);
	}
	else
		for( i = 0; i < n; i++ )
			g_ptr_array_add(p->children, unserialize_policy(pub, b, offset));

	return p;
}

void
serialize_attr (GByteArray* b, GPtrArray* p)
{
	int i = 0;
	int arraySize = p->len;
	ct_attr* temp;

	serialize_uint32(b, (uint32_t) arraySize);
	for (i = 0; i < arraySize; i++)
	{
		temp = g_ptr_array_index(p, i);
		serialize_element(b,	temp->c_i1);
		serialize_element(b,	temp->c_i2);
		serialize_element(b,	temp->id);
	}
}

GPtrArray*
unserialize_attr (bswabe_pub_t* pub, GByteArray* b, int* offset)
{
	int i;
	int arraySize;
	GPtrArray* p;

	p = g_ptr_array_new(); //initialize the GPtrArray

	arraySize = unserialize_uint32(b, offset);

	for (i = 0; i < arraySize ; i++)
	{
		ct_attr* temp;
		temp = (ct_attr*) malloc (sizeof(ct_attr));

		element_init_G1(temp->c_i1,		pub->p);
		element_init_G1(temp->c_i2,		pub->p);
		element_init_Zr(temp->id,		pub->p);

		unserialize_element(b, offset, temp->c_i1);
		unserialize_element(b, offset, temp->c_i2);
		unserialize_element(b, offset, temp->id);

		element_printf("id %i :\t%B\n", i, temp->id);
		element_printf("C1 %i :\t%B\n", i, temp->c_i1);
		element_printf("C2 %i :\t%B\n", i, temp->c_i2);

		g_ptr_array_add(p, temp);
	}

	return p;
}

GByteArray*
bswabe_cph_serialize( bswabe_cph_t* cph )
{
	GByteArray* b;
	b = g_byte_array_new();

	serialize_element(b, 	cph->c_s);
	serialize_element(b, 	cph->c_0);
	serialize_attr   (b, 	cph->attr);

	return b;
}

bswabe_cph_t*
bswabe_cph_unserialize( bswabe_pub_t* pub, GByteArray* b, int free )
{
	bswabe_cph_t* cph;
	int offset;

	cph = (bswabe_cph_t*) malloc(sizeof(bswabe_cph_t));
	offset = 0;

	element_init_GT(cph->c_s, 	pub->p);
	element_init_G1(cph->c_0,  	pub->p);
	unserialize_element(b, &offset, cph->c_s);
	unserialize_element(b, &offset, cph->c_0);
	printf("\nPrinting CT after reconstruction:\n");
	element_printf("C~:\t%B\n", 		cph->c_s);
	element_printf("C0:\t%B\n", 		cph->c_0);
	cph->attr = unserialize_attr(pub, b, &offset);

	if( free )
	{
		g_byte_array_free(b, 1);
	}
	return cph;
}

void
bswabe_pub_free( bswabe_pub_t* pub )
{
	element_clear(pub->g_b);
	element_clear(pub->g_b_sqr);
	element_clear(pub->h_b);
	element_clear(pub->pair);
	pairing_clear(pub->p);
	free(pub->pairing_desc);
	free(pub);
}

void
bswabe_msk_free( bswabe_msk_t* msk )
{
	element_clear(msk->g);
	element_clear(msk->h);
	element_clear(msk->alpha);
	element_clear(msk->beta);
	element_clear(msk->ctr);
	free(msk);
}

void
bswabe_prv_free( bswabe_prv_t* prv )
{
	element_clear(prv->d_0);
	element_clear(prv->d_1);
	element_clear(prv->d_2);
	element_clear(prv->e);
	free(prv);
}

void
bswabe_policy_free( bswabe_policy_t* p )
{
	int i;

	if( p->attr )
	{
		free(p->attr);
		element_clear(p->c);
		element_clear(p->cp);
	}

	for( i = 0; i < p->children->len; i++ )
		bswabe_policy_free(g_ptr_array_index(p->children, i));

	g_ptr_array_free(p->children, 1);

	free(p);
}

void
free_attr (GPtrArray* p)
{
	int i = 0;
	ct_attr* temp;

	for (i = 0; i < p->len; i++)
	{
		temp = g_ptr_array_index(p, i);
		element_clear(temp->c_i1);
		element_clear(temp->c_i2);
		element_clear(temp->id);
	}
}

void
bswabe_cph_free( bswabe_cph_t* cph )
{
	element_clear(cph->c_s);
	element_clear(cph->c_0);
	free_attr(cph->attr);
	g_ptr_array_free(cph->attr, 1);
}
